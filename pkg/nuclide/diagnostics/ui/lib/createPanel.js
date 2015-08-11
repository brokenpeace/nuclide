'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
var invariant = require('assert');
var {debounce} = require('nuclide-commons');
var {compareMessagesByFile} = require('./paneUtils');
var React = require('react-for-atom');
var DiagnosticsPanel = require('./DiagnosticsPanel');

var DEFAULT_TABLE_HEIGHT = 200;

type PanelProps = {
  diagnostics: Array<DiagnosticMessage>;
  height: number;
  onResize: () => mixed;
}

function createDiagnosticsPanel(
  diagnosticUpdater: DiagnosticUpdater
): atom$Panel {
  var diagnosticsPanel: ?DiagnosticsPanel = null;
  var props: PanelProps = {
    diagnostics: [],
    height: DEFAULT_TABLE_HEIGHT,
    onResize: debounce(
      () => {
        invariant(diagnosticsPanel);
        props.height = diagnosticsPanel.getHeight();
        render();
      },
      /* debounceIntervalMs */ 50,
      /* immediate */ false),
  };

  var item = document.createElement('div');
  function render() {
    diagnosticsPanel = React.render(<DiagnosticsPanel {...props} />, item);
  }

  var disposable = diagnosticUpdater.onAllMessagesDidUpdate((messages: Array<DiagnosticMessage>) => {
    props.diagnostics = messages.slice().sort(compareMessagesByFile);
    render();
  });
  var panel = atom.workspace.addBottomPanel({item});
  // Currently, destroy() does not appear to be idempotent:
  // https://github.com/atom/atom/commit/734a79b7ec9f449669e1871871fd0289397f9b60#commitcomment-12631908
  panel.onDidDestroy(() => {
    disposable.dispose();
    React.unmountComponentAtNode(item);
  });
  return panel;
}

module.exports = {
  createDiagnosticsPanel,
};
