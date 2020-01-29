/*=============================================================================
* FILE:   scriptures.js
* AUTHOR: Giovanni Romero
* DATE:   Winter 2020
*
* DESCRIPTION: Front-end Javascript code for The Scriptures, Mapped,
*              IS 542 Winter 2020, BYU.
*/

/*jslint
  browser:true
  long: true */
/*global console, XMLHttpRequest */
/*property
    books, forEach, init, maxBookId, minBookId, onHashChanged,
    onerror, onload, open, parse, push, response, send, status
*/

const Scriptures=(function(){
  "use strict";
      /*-----------------------------------------------------------------
       *                   CONSTANT
       */

       /*-----------------------------------------------------------------
        *                  PRIVATE VARIABLE
        */
        let map;
        let books;
        let volumes;

       /*-----------------------------------------------------------------
        *                  PRIVATE METHOD DECLARATIONS
        */
        let ajax;
        let cacheBooks;
        let init;
        let initMap;
        let onHashChanged;

       /*-----------------------------------------------------------------
        *                  PRIVATE METHODS
        */
        ajax= function (url,successCallback, failureCallback) {
            let request = new XMLHttpRequest();
            request.open("GET", url, true);

            request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                  // Success!
                  let data = JSON.parse(request.response);
                  if(typeof successCallback==="function"){
                    successCallback(data);
                  }
                } else {
                  // We reached our target server, but it returned an error
                    if(typeof failureCallback ==="function"){
                      failureCallback(data);
                    }
                }
            };

            request.onerror = failureCallback;

            request.send();
        };

        cacheBooks= function(callback){
            volumes.forEach((volume) =>{
                let volumeBooks=[];
                let bookId=volume.minBookId;

                while(bookId<=volume.maxBookId){
                  volumeBooks.push(books[bookId]);
                  bookId +=1;
                }
                volume.books=volumeBooks;
            });
            if(typeof callback ==="function"){
                callback();
            }
        };
        initMap= function(){
          console.log("hola in inimap");
          map = new google.maps.Map(document.getElementById("map"), {
             center: {lat: 31.778332, lng: 35.232113},
             zoom: 10
          });
          console.log(map);

        };

        init = function(callback){
          let booksLoaded=false;
          let volumesLoaded=false;
          initMap();
          ajax("https://scriptures.byu.edu/mapscrip/model/books.php",
                data =>{
                  // console.log("Loaded Books from Server");
                  // console.log(data);
                  books=data;
                  booksLoaded=true;
                  if(volumesLoaded){
                    cacheBooks(callback);
                  }

                }
          );
          ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php",
                data =>{
                  // console.log("Loaded Volumes from Server");
                  // console.log(data);
                  volumes=data;
                  volumesLoaded=true;
                  if(booksLoaded){
                    cacheBooks(callback);
                  }

                }
          );

        };
        onHashChanged = function () {
            console.log("The hash is " + location.hash);
        };
       /*-----------------------------------------------------------------
        *                  PUBLIC API
        */

        return {
          init: init,
          init_map: initMap,
          onHashChanged: onHashChanged
        };
}())

// Scriptures.init_map();
