// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    	chrome.declarativeContent.onPageChanged.addRules([{
      		conditions: [new chrome.declarativeContent.PageStateMatcher({
        		pageUrl: {hostEquals: 'localhost', urlContains: "/diff"}, // TODO: change to stash
				css: [".changes"],
      		})],
      		actions: [new chrome.declarativeContent.ShowPageAction()]
    	}]);
  	});
});

function merge_changes(stored_changes, updated_changes) {
	// TODO actually merge things
	//let merged_changes = updated_changes.map((c) => { c.reviewed = true; return c });
	//for now just return the stored changes without updating with updated_changes
	console.log("Stored Changes ", stored_changes);
	let merged_changes = stored_changes; // TEST
	return merged_changes; // always run over stored changes;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method == "merge_state" && request.pr && request.updated_changes) {	
		chrome.storage.local.get([request.pr], (data) => {
			let stored_changes = data[request.pr];
			let merged_changes = merge_changes(stored_changes, request.updated_changes);			
			let update = {};
			update[request.pr] = merged_changes;
			chrome.storage.local.set(update, () => {
				console.log("SET THE VALUE", merged_changes);
				sendResponse({data: merged_changes});
			});
		});
		return true; // async
	}
	else if (request.method == "set_review_status" && request.pr && request.updated_changes) {	
		chrome.storage.local.get([request.pr], (data) => {
			let stored_changes = data[request.pr];
			let merged_changes = merge_changes(stored_changes, request.updated_changes);			
			let update = {};
			update[request.pr] = merged_changes;
			chrome.storage.local.set(update, () => {
				console.log("SET THE VALUE", merged_changes);
				sendResponse({data: merged_changes});
			});
		});
		return true; // async
	else {
		sendResponse({}); // snub them.
	}
});
