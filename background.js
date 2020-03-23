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
	for(let i = 0; i < stored_changes.length; i++) {
		let corresponding_change = updated_changes.filter(c => c.path.toString == stored_changes[i].path.toString);
		if(corresponding_change) {
			corresponding_change = corresponding_change[0]; // there can only be one for now
			if(corresponding_change.contentId == stored_changes[i].contentId) {
				// take the reviewed status from stored because its the same change
				corresponding_change.reviewed = stored_changes[i].reviewed;
			} else {
				corresponding_change.reviewed = false;
			}
		}
	}

	return updated_changes;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method == "merge_state" && request.pr && request.updated_changes) {	
		chrome.storage.local.get([request.pr], (data) => {
			let stored_changes = data[request.pr] || [];
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
	else if (request.method == "set_review_status" && request.pr && request.path) {	
		chrome.storage.local.get([request.pr], (data) => {
			let stored_changes = data[request.pr];
			for(let i = 0; i < stored_changes.length; i++) {
				// TODO: is this okay for multiple changes on the same path?
				if(stored_changes[i].path.toString == request.path) {
					stored_changes[i].reviewed = request.reviewed;
				}
			}
			let update = {};
			update[request.pr] = stored_changes;
			chrome.storage.local.set(update, () => {
				sendResponse({data: true});
			});
		});
		return true; // async
	}
	else {
		sendResponse({}); // snub them.
	}
});
