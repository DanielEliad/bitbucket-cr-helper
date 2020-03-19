let regex = /.*\/projects\/(\w+)\/repos\/(\w+)\/pull-requests\/(\d+)\/.*/mg;
let match = regex.exec(document.location.pathname);
let project = match[1];
let repo = match[2];
let pid = match[3];
let base_url = document.location.origin + "/rest/api/1.0" + "/projects/" + project + "/repos/" + repo + "/pull-requests/" + pid + "/"; 

function get_endpoint(end) {
	return base_url + end;
}

let curr_file = null;

function reviewed_button_clicked() {
	console.log("CLICKEDDD!");
}

function is_file_reviewed(f) {
	return false; // TODO
}

function change_review_button(reviewed) {
	let b = document.getElementById("reviewed_button");
	let spans = b.querySelectorAll("span");
	let last_span = spans[spans.length - 1];
	let text = reviewed ? "Reviewed" : "Not Reviewed";
	// TODO: color
	last_span.innerText = text;
	
}
function create_review_button() {
	let actions = document.querySelector(".diff-actions");
	let newbutton = actions.children[0].cloneNode(true);
	// TODO: fix the no shading issue whe creating a new button
	newbutton.id = "reviewed_button";
	newbutton.onclick = reviewed_button_clicked;
	actions.insertBefore(newbutton, actions.children[0]);
	update_review_button();
}

function update_review_button() {
	change_review_button(is_file_reviewed(curr_file));
}

function viewed_file_changed() {
	curr_file = document.location.hash.slice(1).split("/"); // ignore # at the start and split directories
	// NOTE: we have full access to .change-header class that contains the gui for the changed file!!
	// this means that we can add buttons!!
	if(!document.getElementById("reviewed_button")) {
		create_review_button();
	} else {
		update_review_button();
	}
}

// add viewed file changed callback to window
window.addEventListener('hashchange', viewed_file_changed);
if(document.location.hash) {
	viewed_file_changed();
}

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
		path: normalize_path(change.path)
		
		
	};
}

async function get_pr_changes() {
	let changes_raw = await get_paged_api(get_endpoint("changes"));
	console.log(changes_raw);
	return changes_raw.map(parse_change);
}

get_pr_changes().then((changes) => {
	console.log(changes);
});


// TODO: button: show all non-reviewed files (idea: like the filter file tree and search code buttons -- use the classes supplied by gui)
// TODO: some way of marking as reviewed/not-reviewed
// TODO: handle changes updating under our noses (nullifying review status)
// TODO: 
// TODO: 

