/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {

    var dom = require("pilot/dom");

    var cssText = ".ace-7digital .ace_editor {\
  border: 2px solid rgb(159, 159, 159);\
}\
\
.ace-7digital .ace_editor.ace_focus {\
  border: 2px solid #327fbd;\
}\
\
.ace-7digital .ace_gutter {\
  width: 50px;\
  background: #242424;\
  color: #333;\
  overflow : hidden;\
}\
\
.ace-7digital .ace_gutter-layer {\
  width: 100%;\
  text-align: right;\
}\
\
.ace-7digital .ace_gutter-layer .ace_gutter-cell {\
  padding-right: 6px;\
}\
\
.ace-7digital .ace_print_margin {\
  border-left: 1px solid #3C3C3C;\
  width: 100%;\
  background: #242424;\
}\
\
.ace-7digital .ace_scroller {\
  background-color: #141414;\
}\
\
.ace-7digital .ace_text-layer {\
  cursor: text;\
  color: #F8F8F8;\
}\
\
.ace-7digital .ace_cursor {\
  border-left: 2px solid #A7A7A7;\
}\
\
.ace-7digital .ace_cursor.ace_overwrite {\
  border-left: 0px;\
  border-bottom: 1px solid #A7A7A7;\
}\
.ace-7digital.normal-mode .ace_cursor.ace_overwrite {\
  border: 1px solid #FFE300;\
  background: #766B13;\
}\
.ace-7digital.normal-mode .ace_cursor-layer {\
  z-index: 0;\
}\
 \
.ace-7digital .ace_marker-layer .ace_selection {\
  background: rgba(221, 240, 255, 0.20);\
}\
\
.ace-7digital .ace_marker-layer .ace_step {\
  background: rgb(198, 219, 174);\
}\
\
.ace-7digital .ace_marker-layer .ace_bracket {\
  margin: -1px 0 0 -1px;\
  border: 1px solid rgba(255, 255, 255, 0.25);\
}\
\
.ace-7digital .ace_marker-layer .ace_active_line {\
  background: rgba(255, 255, 255, 0.031);\
}\
\
       \
.ace-7digital .ace_invisible {\
  color: rgba(255, 255, 255, 0.25);\
}\
\
.ace-7digital .ace_keyword {\
  color:#f6b600;\
}\
\
.ace-7digital .ace_keyword.ace_operator {\
  \
}\
\
.ace-7digital .ace_constant {\
  color:#e37915;\
}\
\
.ace-7digital .ace_constant.ace_language {\
  \
}\
\
.ace-7digital .ace_constant.ace_library {\
  \
}\
\
.ace-7digital .ace_constant.ace_numeric {\
  \
}\
\
.ace-7digital .ace_invalid {\
  \
}\
\
.ace-7digital .ace_invalid.ace_illegal {\
  color:#b01e28;\
background-color:rgba(86, 45, 86, 0.75);\
}\
\
.ace-7digital .ace_invalid.ace_deprecated {\
  text-decoration:underline;\
font-style:italic;\
color:#D2A8A1;\
}\
\
.ace-7digital .ace_support {\
  color:#9B859D;\
}\
\
.ace-7digital .ace_support.ace_function {\
  color:#f6b600;\
}\
\
.ace-7digital .ace_function.ace_buildin {\
  \
}\
\
.ace-7digital .ace_string {\
  color:#b01e28;\
}\
\
.ace-7digital .ace_string.ace_regexp {\
  color:#E9C062;\
}\
\
.ace-7digital .ace_comment {\
  font-style:italic;\
color:#5F5A60;\
}\
\
.ace-7digital .ace_comment.ace_doc {\
  \
}\
\
.ace-7digital .ace_comment.ace_doc.ace_tag {\
  \
}\
\
.ace-7digital .ace_variable {\
  color:#7587A6;\
}\
\
.ace-7digital .ace_variable.ace_language {\
  \
}\
\
.ace-7digital .ace_xml_pe {\
  color:#494949;\
}";

    // import CSS once
    dom.importCssString(cssText);

    exports.cssClass = "ace-7digital";
});
