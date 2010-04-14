ace.provide("ace.Editor");

ace.Editor = function(renderer, doc, mode) {
    var container = renderer.getContainerElement();
    this.renderer = renderer;

    this.setMode(mode || new ace.mode.Text());
    this.setDocument(doc || new ace.TextDocument(""));

    this.textInput = new ace.TextInput(container, this);
    new ace.KeyBinding(container, this);

    ace.addListener(container, "mousedown", ace
            .bind(this.onMouseDown, this));
    ace.addListener(container, "dblclick", ace
            .bind(this.onMouseDoubleClick, this));
    ace.addMouseWheelListener(container, ace.bind(this.onMouseWheel, this));
    ace.addTripleClickListener(container, ace.bind(this.selectLine,
                                                   this));

    this.cursor = {
        row : 0,
        column : 0
    };

    this.selectionAnchor = null;
    this.selectionLead = null;
    this.selection = null;

    this.renderer.draw();
};

ace.Editor.prototype.setDocument = function(doc) {
    // TODO: document change is not yet supported
    if (this.doc) {
        throw new Error("TODO: document change is not yet supported");
    }

    this.doc = doc;
    doc.addChangeListener(ace.bind(this.onDocumentChange, this));
    this.renderer.setDocument(doc);

    this.bgTokenizer.setLines(this.doc.lines);
};

ace.Editor.prototype.setMode = function(mode) {

    this.mode = mode;
    var tokenizer = mode.getTokenizer();

    if (!this.bgTokenizer) {
        var onUpdate = ace.bind(this.onTokenizerUpdate, this);
        this.bgTokenizer = new ace.BackgroundTokenizer(tokenizer, onUpdate);
    } else {
        this.bgTokenizer.setTokenizer(tokenizer);
    }

    this.renderer.setTokenizer(this.bgTokenizer);
};

ace.Editor.prototype.resize = function()
{
    this.renderer.scrollToY(this.renderer.getScrollTop());
    this.renderer.draw();
};

ace.Editor.prototype.updateCursor = function() {
    this.renderer.updateCursor(this.cursor);
    this._highlightBrackets();
};

ace.Editor.prototype._highlightBrackets = function() {

    if (this._bracketHighlight) {
        this.renderer.removeMarker(this._bracketHighlight);
        this._bracketHighlight = null;
    }

    if (this._highlightPending) {
        return;
    }

    // perform highlight async to not block the browser during navigation
    var self = this;
    this._highlightPending = true;
    setTimeout(function() {
        self._highlightPending = false;

        var pos = self.doc.findMatchingBracket(self.cursor);
        if (pos) {
            range = {
                start: pos,
                end: {
                    row: pos.row,
                    column: pos.column+1
                }
            };
            self._bracketHighlight = self.renderer.addMarker(range, "bracket");
        }
    }, 10);
};


ace.Editor.prototype.onFocus = function() {
    this.renderer.showCursor();
    this.renderer.visualizeFocus();
};

ace.Editor.prototype.onBlur = function() {
    this.renderer.hideCursor();
    this.renderer.visualizeBlur();
};

ace.Editor.prototype.onDocumentChange = function(startRow, endRow) {
    this.bgTokenizer.start(startRow);
    this.renderer.updateLines(startRow, endRow);
};

ace.Editor.prototype.onTokenizerUpdate = function(startRow, endRow) {
    this.renderer.updateLines(startRow, endRow);
};

ace.Editor.prototype.onMouseDown = function(e) {
    this.textInput.focus();

    var pos = this.renderer.screenToTextCoordinates(e.pageX, e.pageY);
    this.moveCursorToPosition(pos);
    this.setSelectionAnchor(pos.row, pos.column);
    this.renderer.scrollCursorIntoView();

    var _self = this;
    var mousePageX, mousePageY;

    var onMouseSelection = function(e) {
        mousePageX = e.pageX;
        mousePageY = e.pageY;
    };

    var onMouseSelectionEnd = function() {
        clearInterval(timerId);
    };

    var onSelectionInterval = function() {
        if (mousePageX === undefined || mousePageY === undefined)
            return;

        selectionLead = _self.renderer.screenToTextCoordinates(mousePageX,
                                                               mousePageY);

        _self._moveSelection(function() {
            _self.moveCursorToPosition(selectionLead);
        });
        _self.renderer.scrollCursorIntoView();
    };

    ace.capture(this.container, onMouseSelection, onMouseSelectionEnd);
    var timerId = setInterval(onSelectionInterval, 20);

    return ace.preventDefault(e);
};

ace.Editor.prototype.tokenRe = /^[\w\d]+/g;
ace.Editor.prototype.nonTokenRe = /^[^\w\d]+/g;

ace.Editor.prototype.onMouseDoubleClick = function(e) {
    var line = this.doc.getLine(this.cursor.row);
    var column = this.cursor.column;

    var inToken = false;
    if (column > 0) {
        inToken = !!line.charAt(column - 1).match(this.tokenRe);
    }

    if (!inToken) {
        inToken = !!line.charAt(column).match(this.tokenRe);
    }

    var re = inToken ? this.tokenRe : this.nonTokenRe;

    var start = column;
    if (start > 0) {
        do {
            start--;
        }
        while (start >= 0 && line.charAt(start).match(re));
        start++;
    }

    var end = column;
    while (end < line.length && line.charAt(end).match(re)) {
        end++;
    }

    this.setSelectionAnchor(this.cursor.row, start);
    this._moveSelection(function() {
        this.moveCursorTo(this.cursor.row, end);
    });
};

ace.Editor.prototype.onMouseWheel = function(e) {
    var delta = e.wheel;
    this.renderer.scrollToY(this.renderer.getScrollTop() - (delta * 15));
    return ace.preventDefault(e);
};

ace.Editor.prototype.getCopyText = function() {
    if (this.hasSelection()) {
        return this.doc.getTextRange(this.getSelectionRange());
    }
    else {
        return "";
    }
};

ace.Editor.prototype.onCut = function() {
    if (this.hasSelection()) {
        this.moveCursorToPosition(this.doc.remove(this.getSelectionRange()));
        this.clearSelection();
    }
};

ace.Editor.prototype.onTextInput = function(text) {
    if (this.hasSelection()) {
        this.moveCursorToPosition(this.doc.replace(this.getSelectionRange(), text));
        this.clearSelection();
    }
    else {
        this.moveCursorToPosition(this.doc.insert(this.cursor, text));
    }
    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.removeRight = function() {
    if (!this.hasSelection()) {
        this.selectRight();
    }
    this.moveCursorToPosition(this.doc.remove(this.getSelectionRange()));
    this.clearSelection();

    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.removeLeft = function() {
    if (!this.hasSelection()) {
        this.selectLeft();
    }
    this.moveCursorToPosition(this.doc.remove(this.getSelectionRange()));
    this.clearSelection();

    this.renderer.scrollCursorIntoView();
},

ace.Editor.prototype.removeLine = function() {
    this.selectLine();
    this.moveCursorToPosition(this.doc.remove(this.getSelectionRange()));
    this.clearSelection();

    if (this.cursor.row == this.doc.getLength() - 1) {
        this.removeLeft();
        this.moveCursorLineStart();
    }
};

ace.Editor.prototype.blockIndent = function(indentString) {
    if (!this.hasSelection()) return;

    var indentString = indentString || "    ";
    var addedColumns = this.doc.indentRows(this.getSelectionRange(), indentString);

    this.shiftSelection(addedColumns);
};

ace.Editor.prototype.blockOutdent = function(indentString) {
    if (!this.hasSelection()) return;

    var indentString = indentString || "    ";
    var addedColumns = this.doc.outdentRows(this.getSelectionRange(), indentString);

    this.shiftSelection(addedColumns);
};

ace.Editor.prototype.toggleCommentLines = function() {
    if (!this.hasSelection()) return;

    var selection = this.getSelectionRange();
    var addedColumns = this.mode.toggleCommentLines(this.doc, selection);

    this.shiftSelection(addedColumns);
};

ace.Editor.prototype.moveLinesDown = function() {
    this._moveLines(function(firstRow, lastRow) {
        return this.doc.moveLinesDown(firstRow, lastRow);
    });
};

ace.Editor.prototype.moveLinesUp = function() {
    this._moveLines(function(firstRow, lastRow) {
        return this.doc.moveLinesUp(firstRow, lastRow);
    });
};

ace.Editor.prototype._moveLines = function(mover) {
    var range = this.getSelectionRange();
    var firstRow = range.start.row;
    var lastRow = range.end.row;
    if (range.end.column == 0 && (range.start.row !== range.end.row)) {
        lastRow -= 1;
    }

    var linesMoved = mover.call(this, firstRow, lastRow);

    this.setSelectionAnchor(lastRow+linesMoved+1, 0);
    this._moveSelection(function() {
        this.moveCursorTo(firstRow+linesMoved, 0);
    });
};


ace.Editor.prototype.onCompositionStart = function() {
    this.renderer.showComposition(this.cursor);
    this.onTextInput(" ");
};

ace.Editor.prototype.onCompositionUpdate = function(text) {
    this.renderer.setCompositionText(text);
};

ace.Editor.prototype.onCompositionEnd = function() {
    this.renderer.hideComposition();
    this.removeLeft();
};

ace.Editor.prototype.getFirstVisibleRow = function() {
    return this.renderer.getFirstVisibleRow();
};

ace.Editor.prototype.getLastVisibleRow = function() {
    return this.renderer.getLastVisibleRow();
};

ace.Editor.prototype.isRowVisible = function(row) {
    return (row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow());
};

ace.Editor.prototype.getVisibleRowCount = function() {
    return this.getLastVisibleRow() - this.getFirstVisibleRow() + 1;
};

ace.Editor.prototype.getPageDownRow = function() {
    return this.renderer.getLastVisibleRow() - 1;
};

ace.Editor.prototype.getPageUpRow = function() {
    var firstRow = this.renderer.getFirstVisibleRow();
    var lastRow = this.renderer.getLastVisibleRow();

    return firstRow - (lastRow - firstRow) + 1;
};

ace.Editor.prototype.scrollPageDown = function() {
    this.scrollToRow(this.getPageDownRow());
};

ace.Editor.prototype.scrollPageUp = function() {
    this.renderer.scrollToRow(this.getPageUpRow());
};

ace.Editor.prototype.scrollToRow = function(row) {
    this.renderer.scrollToRow(row);
};

ace.Editor.prototype.navigateTo = function(row, column) {
    this.clearSelection();
    this.moveCursorTo(row, column);
    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.navigateUp = function() {
    this.clearSelection();
    this.moveCursorUp();
    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.navigateDown = function() {
    this.clearSelection();
    this.moveCursorDown();
    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.navigateLeft = function() {
    if (this.hasSelection()) {
        var selectionStart = this.getSelectionRange().start;
        this.moveCursorToPosition(selectionStart);
    }
    else {
        this.moveCursorLeft();
    }
    this.clearSelection();

    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.navigateRight = function() {
    if (this.hasSelection()) {
        var selectionEnd = this.getSelectionRange().end;
        this.moveCursorToPosition(selectionEnd);
    }
    else {
        this.moveCursorRight();
    }
    this.clearSelection();

    this.renderer.scrollCursorIntoView();
},

ace.Editor.prototype.navigateLineStart = function() {
    this.clearSelection();
    this.moveCursorLineStart();
    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.navigateLineEnd = function() {
    this.clearSelection();
    this.moveCursorLineEnd();
    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.navigateFileEnd = function() {
    this.clearSelection();
    this.moveCursorFileEnd();
    this.renderer.scrollCursorIntoView();
},

ace.Editor.prototype.navigateFileStart = function() {
    this.clearSelection();
    this.moveCursorFileStart();
    this.renderer.scrollCursorIntoView();
},

ace.Editor.prototype.navigateWordRight = function() {
    this.clearSelection();
    this.moveCursorWordRight();
    this.renderer.scrollCursorIntoView();
},

ace.Editor.prototype.navigateWordLeft = function() {
    this.clearSelection();
    this.moveCursorWordLeft();
    this.renderer.scrollCursorIntoView();
},

ace.Editor.prototype.moveCursorUp = function() {
    this.moveCursorBy(-1, 0);
};

ace.Editor.prototype.moveCursorDown = function() {
    this.moveCursorBy(1, 0);
};

ace.Editor.prototype.moveCursorLeft = function() {
    if (this.cursor.column == 0) {
        if (this.cursor.row > 0) {
            this.moveCursorTo(this.cursor.row - 1, this.doc
                    .getLine(this.cursor.row - 1).length);
        }
    }
    else {
        this.moveCursorBy(0, -1);
    }
};

ace.Editor.prototype.moveCursorRight = function() {
    if (this.cursor.column == this.doc.getLine(this.cursor.row).length) {
        if (this.cursor.row < this.doc.getLength() - 1) {
            this.moveCursorTo(this.cursor.row + 1, 0);
        }
    }
    else {
        this.moveCursorBy(0, 1);
    }
};

ace.Editor.prototype.moveCursorLineStart = function() {
    this.moveCursorTo(this.cursor.row, 0);
};

ace.Editor.prototype.moveCursorLineEnd = function() {
    this.moveCursorTo(this.cursor.row,
                      this.doc.getLine(this.cursor.row).length);
};

ace.Editor.prototype.moveCursorFileEnd = function() {
    var row = this.doc.getLength() - 1;
    var column = this.doc.getLine(row).length;
    this.moveCursorTo(row, column);
};

ace.Editor.prototype.moveCursorFileStart = function() {
    this.moveCursorTo(0, 0);
};

ace.Editor.prototype.moveCursorWordRight = function() {
    var row = this.cursor.row;
    var column = this.cursor.column;
    var line = this.doc.getLine(row);
    var rightOfCursor = line.substring(column);

    var match;
    this.nonTokenRe.lastIndex = 0;
    this.tokenRe.lastIndex = 0;

    if (column == line.length) {
        this.moveCursorRight();
        return;
    }
    else if (match = this.nonTokenRe.exec(rightOfCursor)) {
        column += this.nonTokenRe.lastIndex;
        this.nonTokenRe.lastIndex = 0;
    }
    else if (match = this.tokenRe.exec(rightOfCursor)) {
        column += this.tokenRe.lastIndex;
        this.tokenRe.lastIndex = 0;
    }

    this.moveCursorTo(row, column);
};

ace.Editor.prototype.moveCursorWordLeft = function() {
    var row = this.cursor.row;
    var column = this.cursor.column;
    var line = this.doc.getLine(row);
    var leftOfCursor = ace.stringReverse(line.substring(0, column));

    var match;
    this.nonTokenRe.lastIndex = 0;
    this.tokenRe.lastIndex = 0;

    if (column == 0) {
        this.moveCursorLeft();
        return;
    }
    else if (match = this.nonTokenRe.exec(leftOfCursor)) {
        column -= this.nonTokenRe.lastIndex;
        this.nonTokenRe.lastIndex = 0;
    }
    else if (match = this.tokenRe.exec(leftOfCursor)) {
        column -= this.tokenRe.lastIndex;
        this.tokenRe.lastIndex = 0;
    }

    this.moveCursorTo(row, column);
};

ace.Editor.prototype.moveCursorBy = function(rows, chars) {
    this.moveCursorTo(this.cursor.row + rows, this.cursor.column + chars);
};


ace.Editor.prototype.moveCursorToPosition = function(position) {
    this.moveCursorTo(position.row, position.column);
};

ace.Editor.prototype._clipPositionToDocument = function(row, column) {
    var pos = {};

    if (row >= this.doc.getLength()) {
        pos.row = this.doc.getLength() - 1;
        pos.column = this.doc.getLine(pos.row).length;
    }
    else if (row < 0) {
        pos.row = 0;
        pos.column = 0;
    }
    else {
        pos.row = row;
        pos.column = Math.min(this.doc.getLine(pos.row).length,
                Math.max(0, column));
    }
    return pos;
};

ace.Editor.prototype.moveCursorTo = function(row, column) {
    this.cursor = this._clipPositionToDocument(row, column);
    this.updateCursor();
};

ace.Editor.prototype.gotoLine = function(lineNumber) {
    this.moveCursorTo(lineNumber, 0);
    if (!this.isRowVisible(this.cursor.row)) {
        this.scrollToRow(lineNumber - Math.floor(this.getVisibleRowCount() / 2));
    }
},

ace.Editor.prototype.getCursorPosition = function() {
    return {
        row : this.cursor.row,
        column : this.cursor.column
    };
};

ace.Editor.prototype.hasSelection = function() {
    return !!this.selectionLead;
};

ace.Editor.prototype.hasMultiLineSelection = function() {
    if (!this.hasSelection()) {
        return false;
    }

    var range = this.getSelectionRange();
    return (range.start.row !== range.end.row);
};

ace.Editor.prototype.setSelectionAnchor = function(row, column) {
    this.clearSelection();

    this.selectionAnchor = this._clipPositionToDocument(row, column);
    this.selectionLead = null;
};

ace.Editor.prototype.getSelectionAnchor = function() {
    if (this.selectionAnchor) {
        return {
            row: this.selectionAnchor.row,
            column: this.selectionAnchor.column
        };
    } else {
        return null;
    }
};

ace.Editor.prototype.getSelectionLead = function() {
    if (this.selectionLead) {
        return {
            row: this.selectionLead.row,
            column: this.selectionLead.column
        };
    } else {
        return null;
    }
};

ace.Editor.prototype.shiftSelection = function(columns) {
    if (!this.hasSelection()) return;

    var anchor = this.getSelectionAnchor();
    var lead = this.getSelectionLead();

    this.setSelectionAnchor(anchor.row, anchor.column + columns);
    this._moveSelection(function() {
        this.moveCursorTo(lead.row, lead.column + columns);
    });
};

ace.Editor.prototype.getSelectionRange = function() {
    var anchor = this.selectionAnchor || this.cursor;
    var lead = this.selectionLead || this.cursor;

    if (anchor.row > lead.row
            || (anchor.row == lead.row && anchor.column > lead.column)) {
        return {
            start : lead,
            end : anchor
        };
    }
    else {
        return {
            start : anchor,
            end : lead
        };
    }
};

ace.Editor.prototype.clearSelection = function() {
    this.selectionLead = null;
    this.selectionAnchor = null;

    if (this.selection) {
        this.renderer.removeMarker(this.selection);
        this.selection = null;
    }
};

ace.Editor.prototype.selectAll = function() {
    var lastRow = this.doc.getLength() - 1;
    this.setSelectionAnchor(lastRow, this.doc.getLine(lastRow).length);

    this._moveSelection(function() {
        this.moveCursorTo(0, 0);
    });
};

ace.Editor.prototype._moveSelection = function(mover) {
    if (!this.selectionAnchor) {
        this.selectionAnchor = {
            row : this.cursor.row,
            column : this.cursor.column
        };
    }

    mover.call(this);

    this.selectionLead = {
        row : this.cursor.row,
        column : this.cursor.column
    };

    if (this.selection) {
        this.renderer.removeMarker(this.selection);
    }
    this.selection = this.renderer.addMarker(this.getSelectionRange(),
                                             "selection", "text");
    this.renderer.scrollCursorIntoView();
};

ace.Editor.prototype.selectUp = function() {
    this._moveSelection(this.moveCursorUp);
};

ace.Editor.prototype.selectDown = function() {
    this._moveSelection(this.moveCursorDown);
};

ace.Editor.prototype.selectRight = function() {
    this._moveSelection(this.moveCursorRight);
};

ace.Editor.prototype.selectLeft = function() {
    this._moveSelection(this.moveCursorLeft);
};

ace.Editor.prototype.selectLineStart = function() {
    this._moveSelection(this.moveCursorLineStart);
};

ace.Editor.prototype.selectLineEnd = function() {
    this._moveSelection(this.moveCursorLineEnd);
};

ace.Editor.prototype.selectPageDown = function() {
    var row = this.getPageDownRow() + Math.floor(this.getVisibleRowCount() / 2);

    this.scrollPageDown();

    this._moveSelection(function() {
        this.moveCursorTo(row, this.cursor.column);
    });
};

ace.Editor.prototype.selectPageUp = function() {
    var visibleRows = this.getLastVisibleRow() - this.getFirstVisibleRow();
    var row = this.getPageUpRow() + Math.round(visibleRows / 2);

    this.scrollPageUp();

    this._moveSelection(function() {
        this.moveCursorTo(row, this.cursor.column);
    });
};

ace.Editor.prototype.selectFileEnd = function() {
    this._moveSelection(this.moveCursorFileEnd);
};

ace.Editor.prototype.selectFileStart = function() {
    this._moveSelection(this.moveCursorFileStart);
};

ace.Editor.prototype.selectWordRight = function() {
    this._moveSelection(this.moveCursorWordRight);
};

ace.Editor.prototype.selectWordLeft = function() {
    this._moveSelection(this.moveCursorWordLeft);
};

ace.Editor.prototype.selectLine = function() {
    this.setSelectionAnchor(this.cursor.row, 0);
    this._moveSelection(function() {
        this.moveCursorTo(this.cursor.row + 1, 0);
    });
};