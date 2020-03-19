// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let collapseButton = document.getElementById('CollapseDirs');
let apiButton = document.getElementById('apiButton');

function execute(fileName) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
   	chrome.tabs.executeScript(
        tabs[0].id,
        {file: fileName});

  });
}

collapseButton.onclick = function(element) {
	execute("collapse.js");
};

apiButton.onclick = function(element) {
	execute("getpr.js");
};

