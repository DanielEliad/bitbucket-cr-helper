function close_all_folders() {
	all_folders= Array.from(document.querySelectorAll(".directory-label").values());
	// console.log("all_folders", all_folders);
	open_folders = Array.from(document.querySelectorAll(".directory-label .icon-folder-opened").values());
	open_folders = open_folders.map(x => x.parentElement);
	// console.log("open_folders", open_folders);
	for(var i = 0; i< all_folders.length; i++) {
		all_folders[i].oncontextmenu = function(event) {
			// console.log("right clicked!");
			if(event.preventDefault != undefined)
				event.preventDefault();
			if(event.stopPropagation != undefined)
				event.stopPropagation();
			all_folders[i].click();
			return false;
		}
		if(open_folders.includes(all_folders[i])) {
			all_folders[i].click();
		}
		
	}
}

// get attributes for the current page
let regex = /.*\/projects\/(\w+)\/repos\/(\w+)\/pull-requests\/(\d+)\/.*/mg;
let match = regex.exec(document.location.pathname);
let project = match[1];
let repo = match[2];
let pid = match[3];
let pr_name = project + "_" + repo + "_" + pid;
let local_change_state = {};
let base_url = document.location.origin + "/rest/api/1.0" + "/projects/" + project + "/repos/" + repo + "/pull-requests/" + pid + "/"; 
let curr_file = null;

function get_endpoint(end) {
	return base_url + end;
}

function reviewed_button_clicked() {
	// console.log("clicked reviewe button!");
	mark_change(curr_file, !local_change_state[curr_file].reviewed).then(res => {
		update_review_button();
	});
}

function create_review_button() {
	// console.log("adding review button");
	let actions = document.querySelector(".diff-actions");
	let newbutton = actions.children[0].cloneNode(true);
	// TODO: fix the no shading issue whe creating a new button
	newbutton.id = "reviewed_button";
	newbutton.onclick = reviewed_button_clicked;
	actions.insertBefore(newbutton, actions.children[0]);
	update_review_button();
}

function update_review_button() {
	
	if(!document.location.pathname.endsWith("/diff") || !document.location.hash) {
		return;
	}
	if(!document.getElementById("reviewed_button")) {
		create_review_button();
	}

	const reviewed = get_change_reviewed_status(curr_file);
	let b = document.getElementById("reviewed_button");
	let spans = b.querySelectorAll("span");
	let inner_span = spans[1];
	let text = reviewed ? "Reviewed" : "Not Reviewed";
	// console.log("review button is now ", text);
	// TODO: color
	inner_span.removeAttribute("class");
	inner_span.removeAttribute("aria-label");
	inner_span.innerHTML = text;
}

function add_close_all_button() {
	let changes_actions = document.querySelector(".changes-scope-actions");
	let new_action = changes_actions.children[0].cloneNode(true);
	new_action.id = "new_action_button";
	let s = new_action.querySelector("span:nth-child(2)");
	s.innerText = "Close All";
	changes_actions.insertBefore(new_action, changes_actions.children[0]);
	new_action.onclick = close_all_folders;
}

function viewed_file_changed() {
	//console.log("hash changed", document.location);
	if(!document.location.pathname.endsWith("/diff") || !document.location.hash) {
		return;
	}

	curr_file = document.location.hash.slice(1) // ignore # at the start

	if(!document.getElementById("reviewed_button")) {
		create_review_button();
	} else {
		update_review_button();
	}
	if(!document.getElementById("new_action_button")) {
		add_close_all_button();
	}
}

// add viewed file changed callback to window
window.addEventListener('hashchange', viewed_file_changed);
// Try to update anyways
viewed_file_changed();

async function get_paged_api(url) {
	let full_data = [];
	let next_page = 0;
	let cont = true;
	while(cont) {
		let resp = await fetch(url + "?start=" + next_page);
		let data = await resp.json();
		
		full_data = full_data.concat(data.values);
		if(data.isLastPage) {
			cont = false;
		} else {
			next_page = data.nextPageStart;
		}
	}
	return full_data;
}

function normalize_path(p) {
	return p;
}

function parse_change(change) {
	// TODO: handle executable changes	
	// TODO: handle complex move and slight changes combination
	return {
		type: change.type,
		src: change.srcPath,
		path: normalize_path(change.path),
		contentId: change.contentId
	};
}

async function get_pr_changes() {
	let changes_raw = await get_paged_api(get_endpoint("changes"));
	// console.log(changes_raw);
	return changes_raw.map(parse_change);
}

function merge_state_with_storage(changes) {
	// TODO: merge the storage state for which changes exist and which are rendered unreviewed or unaffected by these updated changes.
	// local_change_state will be equal to internal storage state at the end of this function
	return new Promise(resolve => {
		chrome.runtime.sendMessage({method: "merge_state", pr: pr_name, updated_changes: changes }, function(response) {
			// console.log(response.data);
			let merged_changes = response.data;
			// index the changes by path
			// console.log("fixing up local change state with merged changes: ", merged_changes);
			local_change_state = {};
			for(let i = 0; i < merged_changes.length; i++) {
				// TODO: solve bug with two changes to the same path
				// console.log("updating key ", merged_changes[i].path.toString);
				local_change_state[merged_changes[i].path.toString] = merged_changes[i];
			}
			resolve(true);
		});
	});
}

function mark_change(path, reviewed) {
	local_change_state[path].reviewed = reviewed;
	let payload = {method: "set_review_status", pr: pr_name, path: path, reviewed: reviewed };
	return new Promise(resolve => {
		chrome.runtime.sendMessage(payload, function(response) { 
			// console.log("successfully set reviewe status ", response); 
			resolve(true);
		});
	});
}

function get_change_reviewed_status(path) {
	// console.log("getting change reviewed status for path ", path);
	// console.log(local_change_state);
	if(local_change_state[path]) {
		return local_change_state[path].reviewed;
	}

	return false;
}

get_pr_changes().then((changes) => {
	merge_state_with_storage(changes).then(() => {
		// console.log("updating button");
		update_review_button();
	});
});

// TODO: button: show all non-reviewed files (idea: like the filter file tree and search code buttons -- use the classes supplied by gui)
// TODO: some way of marking as reviewed/not-reviewed
// TODO: handle changes updating under our noses (nullifying review status)
// TODO: bug with first location change
// TODO: 


// solution to dom changes observe https://stackoverflow.com/questions/2844565/is-there-a-javascript-jquery-dom-change-listener
let changes_tree = document.querySelector(".changes-tree");


function opened_dir_mutation_filter(m) {
	return m.type == "childList" && m.target.className=="directory" && m.addedNodes.length == 1 && m.addedNodes[0].className == "files";
}

function get_full_folder_name(target) {
	let name = target.querySelector("button").innerText;
	let curr_target = target;
	while(!curr_target.parentElement.classList.contains("root-directory")) {
		curr_target = curr_target.parentElement.parentElement; // next directory is two elements up
		name = curr_target.querySelector("button").innerText + "/" + name;
	}

	return name;

}


function handle_mutations(mutations) {
	const opened_dir_muts = mutations.filter(opened_dir_mutation_filter);
	opened_dir_muts.forEach(m => console.log("Opened dir ", get_full_folder_name(m.target)));
}

let obs = new MutationObserver((m, obs)  => handle_mutations(m));
obs.observe(changes_tree, { subtree: true, attributes: true, childList: true, characterData: true })





























