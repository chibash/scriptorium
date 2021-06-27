// Copyright (C) 2019-2021 by Shigeru Chiba.

(function () {

const helppage = './help.html'

const loopColor = 210
const condColor = 230
const funcColor = 20
const baseColor = 120

Blockly.Blocks['for_of'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("for (const")
        .appendField(new Blockly.FieldTextInput("i"), "var")
        .appendField("of range(")
        .appendField(new Blockly.FieldTextInput("1"), "range")
        .appendField(")) {");
    this.appendStatementInput("body")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("}");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(loopColor);
    this.setTooltip("繰り返し");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['for_of'] = function(block) {
  const var_name = block.getFieldValue('var');
  const range_value = block.getFieldValue('range');
  const body = Blockly.JavaScript.statementToCode(block, 'body');
  const code = `for (const ${var_name} of range(${range_value})) {\n${body} }\n`;
  return code;
};

Blockly.Blocks['if'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("if (")
        .appendField(new Blockly.FieldTextInput(""), "cond")
        .appendField(") {");
    this.appendStatementInput("then")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("} else {");
    this.appendStatementInput("else")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("}");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(condColor);
    this.setTooltip("条件分け");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['if'] = function(block) {
  const expr_cond = block.getFieldValue('cond');
  const stmnt_then = Blockly.JavaScript.statementToCode(block, 'then');
  const stmnt_else = Blockly.JavaScript.statementToCode(block, 'else');
  const code = `if (${expr_cond}) {\n${stmnt_then}\n} else {\n${stmnt_else}\n}\n`;
  return code;
};

Blockly.Blocks['ifthen'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("if (")
        .appendField(new Blockly.FieldTextInput(""), "cond")
        .appendField(") {");
    this.appendStatementInput("then")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("}");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(condColor);
    this.setTooltip("条件つき実行");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['ifthen'] = function(block) {
  const expr_cond = block.getFieldValue('cond');
  const stmnt_then = Blockly.JavaScript.statementToCode(block, 'then');
  const code = `if (${expr_cond}) {\n${stmnt_then}\n}\n`;
  return code;
};

Blockly.Blocks['ifelse2'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("if (")
        .appendField(new Blockly.FieldTextInput(""), "cond")
        .appendField(") {");
    this.appendStatementInput("then")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("} else if (")
        .appendField(new Blockly.FieldTextInput(""), "cond2")
        .appendField(") {");
    this.appendStatementInput("then2")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("} else {");
    this.appendStatementInput("else")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("}");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(condColor);
    this.setTooltip("複数の条件分け");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['ifelse2'] = function(block) {
  const expr_cond = block.getFieldValue('cond');
  const stmnt_then = Blockly.JavaScript.statementToCode(block, 'then');
  const expr_cond2 = block.getFieldValue('cond2');
  const stmnt_then2 = Blockly.JavaScript.statementToCode(block, 'then2');
  const stmnt_else = Blockly.JavaScript.statementToCode(block, 'else');
  const code = `if (${expr_cond}) {\n${stmnt_then}\n} else if (${expr_cond2}) {\n${stmnt_then2}\n} else {\n${stmnt_else}\n}\n`;
  return code;
};

Blockly.Blocks['func'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("function")
        .appendField(new Blockly.FieldTextInput("draw"), "name")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput(""), "params")
        .appendField(") {");
    this.appendStatementInput("body")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("}");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(funcColor);
    this.setTooltip("関数の宣言");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['func'] = function(block) {
  const name = block.getFieldValue('name');
  const params = block.getFieldValue('params');
  const body = Blockly.JavaScript.statementToCode(block, 'body');
  const code = `function ${name}(${params}) {\n${body}\n}\n`;
  return code;
};

Blockly.Blocks['const'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("const")
        .appendField(new Blockly.FieldTextInput("k"), "name")
        .appendField("=")
        .appendField(new Blockly.FieldTextInput("0"), "value");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(baseColor);
    this.setTooltip("const の宣言");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['const'] = function(block) {
  const var_name = block.getFieldValue('name');
  const value = block.getFieldValue('value');
  const code = `const ${var_name} = ${value}\n`;
  return code;
};

Blockly.Blocks['let'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("let")
        .appendField(new Blockly.FieldTextInput("k"), "name")
        .appendField("=")
        .appendField(new Blockly.FieldTextInput("0"), "value");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(baseColor);
    this.setTooltip("変数の宣言");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['let'] = function(block) {
  const var_name = block.getFieldValue('name');
  const value = block.getFieldValue('value');
  const code = `let ${var_name} = ${value}\n`;
  return code;
};

Blockly.Blocks['statement'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput(""), "code");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(baseColor);
    this.setTooltip("すきな１行分のプログラム");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['statement'] = function(block) {
  const prog = block.getFieldValue('code');
  const code = `${prog}\n`;
  return code;
};

Blockly.Blocks['log'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("console.log(")
        .appendField(new Blockly.FieldTextInput("0"), "value")
        .appendField(")");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(baseColor);
    this.setTooltip("値の表示");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['log'] = function(block) {
  const value = block.getFieldValue('value');
  const code = `console.log(${value})\n`;
  return code;
};

Blockly.Blocks['turtle'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("turtle.")
          .appendField(new Blockly.FieldDropdown([
              ['forward', 'forward'],
              ['left', 'left'],
              ['right', 'right'],
              ['move', 'move'],
              ['up', 'up'],
              ['down', 'down'],
              ['width', 'width'],
              ['color', 'color'],
              ['speed', 'speed'],
              ['image', 'image']
          ]), "name")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput("100"), "args")
        .appendField(")");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(baseColor);
    this.setTooltip("タートルへ命令する");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['turtle'] = function(block) {
  const name = block.getFieldValue('name');
  const args = block.getFieldValue('args');
  const code = `turtle.${name}(${args})\n`;
  return code;
};

Blockly.Blocks['pro'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("pro.")
          .appendField(new Blockly.FieldDropdown([
              ['start', 'start'],
              ['arc', 'arc'],
              ['background', 'background'],
              ['beep', 'beep'],
              ['circle', 'circle'],
              ['color', 'color'],
              ['crossing', 'crossing'],
              ['elipse', 'elipse'],
              ['fill', 'fill'],
              ['frameRate', 'frameRate'],
              ['line', 'line'],
              ['noFill', 'noFill'],
              ['rect', 'rect'],
              ['stroke', 'stroke'],
              ['stop', 'stop'],
              ['text', 'text'],
              ['textFont', 'textFont']
          ]), "name")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput(""), "args")
        .appendField(")");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(baseColor);
    this.setTooltip("Processing 風プログラミング");
    this.setHelpUrl(helppage);
  }
};

Blockly.JavaScript['pro'] = function(block) {
  const name = block.getFieldValue('name');
  const args = block.getFieldValue('args');
  const code = `pro.${name}(${args})\n`;
  return code;
};

})();
