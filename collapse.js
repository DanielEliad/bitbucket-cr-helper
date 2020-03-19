d = document.getElementsByClassName("directory-label");
for(var i = 0; i< d.length; i++) {
	if(d[i].innerHTML.includes("folder-opened")) {
		d[i].click();
	}
}
