//
//  The loadAndFilter function loads a text file into a url, removing anything between a set of hide/show tags.
//  The function has the signature loadAndFilter(url, destDiv, tabSize
//
//  These tags look like
//       <!--hide--> and <!--show-->
//   or 
//       //hide and // show
//   you can also hide a single line with a skip tag that looks like
//      <!--skip--> or //skip
//   
//   The text file is usually a symbolic link to a .html, .js, or .css file. The symbolic link is
//   used to make the file look like a .txt file so that it isn't interpreted on loading. Interpreting html files
//   in particular tends to throw out some newlines that should be kept. 
//   
//   The filtering process converts <, >, and " to escaped versions that will display properly.
//   It then invokes the prettyPrinter function for the whole page, about 5 seconds later.
//
//   destDiv is assumed to be the id of the destDiv, typically prettyCSS, prettyJS, or prettyHTML
//   The tabSize argument adjusts the amount of preceding spaces. It assumes that the tabs in the file have already
//   been expanded to 4 spaces. Using a value of 2 will give you the effect of 2 character tabstops (less indenting).
//
//



function loadAndFilter(url, destDiv, tabSize) {
    function filterStuff(text, destDiv, tabSize) {

        var tabString = "";
        for (var j = 0; j < tabSize; j++) {
            tabString = tabString + " ";
        }

        var lines = text.split(/\n/);
        var filterIsOn = true;
        var inPre = false;
        var result = "";
        var n = lines.length;
        for (var i = 0; i < n; i++) {
            var curLine = lines[i];
            if (!curLine)
                continue;

            if (curLine.indexOf("<!--hide-->", 0) >= 0 ||
                    curLine.indexOf("//hide", 0) >= 0) {
                filterIsOn = false;
            }
            else if (curLine.indexOf("<!--show-->", 0) >= 0 ||
                    curLine.indexOf("//show", 0) >= 0) {
                filterIsOn = true;
            }
            else if (curLine.indexOf("<!--skip-->", 0) >= 0 ||
                    curLine.indexOf("//skip") >= 0) {
                /* do nothing */
            }
            else if (curLine.indexOf("<pre") >= 0) {
                inPre = true;
            }
            else if (curLine.indexOf("</pre") >= 0) {
                inPre = false;
            }
            else {
                if (filterIsOn && !inPre) {
                    cleanedLine = curLine.replace(/&/g, '&amp;').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&quot;");
                    cleanedLine = cleanedLine.replace(/    /g, tabString);
                    result = result + cleanedLine + "\n";
                }
            }
        }

        var thediv = document.getElementById(destDiv);
        if (!thediv) {
            alert("destDiv " + destDiv + " is not in the document");
        }
        else {
            thediv.innerHTML = result;
        }

        if (!window.firePrettyPrintEric) {
            window.firePrettyPrintEric = true;
            setTimeout(function() {
                window.prettyPrint();
            }, 3000);
        }
    }

    if (typeof window.$ === 'undefined') {
        alert("Developer error, jquery wasn't loaded.")
    }
    //
    // We initiate this fetch in a timeout so that it doesn't slow down the download
    // of the elements that actually do useful stuff. 
    //
    setTimeout(function() {
        $.get(url, function(response, status, xhr) {
            //
            // the most likely error is that there is no .txt file for the url.
            //
            if (status == "error") {
                var msg = "Sorry but there was an error: " + xhr.status + " " + xhr.statusText;
                alert(msg);
                return;
            }
            else {
                filterStuff(response, destDiv, tabSize);
            }
        }, 'text');
    }, 1000);

}


//
// given that location.href = somesite://somepath/myname.html
// this function returns   js/myname.js
// 
function getHelperPath(suffix) {
    var originalPath = location.href;
    var parts = originalPath.split("/");
    var htmlName = parts[parts.length-1];
    return suffix + "/" + htmlName.replace(/.html$/, '.' + suffix);    
}

