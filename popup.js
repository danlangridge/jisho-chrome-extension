// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
 function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
 function getDefinition(searchTerm, callback, errorCallback) {

  var searchUrl = 'http://jisho.org/api/v1/search/words?keyword=' + encodeURI(searchTerm);
  var x = new XMLHttpRequest();
  x.open('GET', searchUrl);

  x.responseType = 'json';
  x.onload = function() {

    var response = x.response;
    if (!response) {
      errorCallback('No response from Jisho search!');
      return;
    }
    var results = response.data;

    callback(results);
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send();
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {

    var jishoSearchBox = document.getElementById("jisho-search-box");

    jishoSearchBox.addEventListener('change', function() {

      var searchTerm = jishoSearchBox.value; 

      renderStatus('searching Jisho for: ' + searchTerm + '...');

      getDefinition( searchTerm, function(results) {

        document.getElementById("status").innerHTML = "";

        if (results.length == 0) {
          document.getElementById('jisho-json').innerHTML = "no definitions found for: " + searchTerm;
        } 
        var firstResult = results[0];

        var definitionHTML = "";

        for (var j = 0; j < results.length; j++) {
          definitionHTML += "<div class=\"reading\">" ;

          var japaneseResult = results[j].japanese;


          definitionHTML += "<br>";
          
          definitionHTML += "<div class=\"japaneseReading\">" ;

          if (japaneseResult[0].word != undefined) {

            definitionHTML += "<div class=\"kanji\"><b>" +
            japaneseResult[0].word + 
            "</b></div>" + "<br>";
          }
          definitionHTML += japaneseResult[0].reading + "<br>";
          definitionHTML += "</div>";

          var englishResult = results[j].senses;

          definitionHTML += "<div class=\"englishReading\">" ;
          for (var k = 0; k < englishResult[0].english_definitions.length; k++) {
            var definition = englishResult[0].english_definitions[k];

            definitionHTML += definition + "<br>";
          }
          definitionHTML += "</div>"

          definitionHTML += "</div>"
        }

        document.getElementById('jisho-definitions').innerHTML = definitionHTML;

      }, function(errorMessage) {
        renderStatus('failed to show results. ' + errorMessage);
      });
    });
  });
});

function getSelectionText() {
  var text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    text = document.selection.createRange().text;
  }
  return text;
}

document.addEventListener("selectionchange", function() {
  console.log(getSelectionText());
});


/*

    var searchTerm = "日";

    renderStatus('searching Jisho for ' + searchTerm);

    getDefinition( searchTerm, function(results) {
      if (results.length == 0) {
              document.getElementById('jisho-json').innerHTML = "no definitions found for: " + searchTerm;
      } 
      var firstResult = results[0];
      var japaneseResult = firstResult.japanese;

      var englishResult = firstResult.senses;

      document.getElementById('jisho-json').innerHTML = JSON.stringify(japaneseResult);

    }, function(errorMessage) {
      renderStatus('Cannot display image. ' + errorMessage);
    });
  });
});
*/