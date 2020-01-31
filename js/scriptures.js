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
/*global console, XMLHttpRequest, google */
/*property
    Map, books, center, classKey, content, forEach, fullName, getElementById,
    gridName, hash, href, id, init, initMap, innerHTML, lat, length, lng, log,
    maps, maxBookId, minBookId, numChapters, onHashChanged, onerror, onload,
    open, parse, push, response, send, slice, split, status, zoom
*/

const Scriptures=(function(){
  "use strict";
      /*-----------------------------------------------------------------
       *                   CONSTANT
       */
       const BOTTOM_PADDING="<br /><br />";
       const CLASS_BOOKS="books";
       const CLASS_BUTTON="btn";
       const CLASS_VOLUME="volumes";
       const DIV_SCRIPTURES_NAVIGATOR="scripnav";
       const DIV_SCRIPTURES="scriptures";
       const REQUEST_GET= "GET";
       const REQUEST_STATUS_OK =200;
       const REQUEST_STATUS_ERROR = 400;
       const TAG_VOLUME_HEADER = "h5";
       const URL_BOOKS= "https://scriptures.byu.edu/mapscrip/model/books.php";
       const URL_VOLUMES= "https://scriptures.byu.edu/mapscrip/model/volumes.php";

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
        let bookChapterValid;
        let booksGrid;
        let booksGridContent;
        let cacheBooks;
        let htmlAnchor;
        let htmlDiv;
        let htmlElement;
        let htmlLink;
        let init;
        let initMap;
        let navigateBook;
        let navigateChapter;
        let navigateHome;
        let onHashChanged;
        let volumesGridContent;

       /*-----------------------------------------------------------------
        *                  PRIVATE METHODS
        */
        ajax= function (url,successCallback, failureCallback) {
            let request = new XMLHttpRequest();
            request.open(REQUEST_GET, url, true);

            request.onload = function() {
                if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                  // Success!
                  let data = JSON.parse(request.response);
                  if(typeof successCallback==="function"){
                    successCallback(data);
                  }
                } else {
                  // We reached our target server, but it returned an error
                    if(typeof failureCallback ==="function"){
                      failureCallback(request);
                    }
                }
            };

            request.onerror = failureCallback;

            request.send();
        };

        bookChapterValid= function(bookId, chapter){
          let book= books[bookId];
          if(book === undefined || chapter <0 || chapter> book.numChapters){
            return false;
          }
          if (chapter ===0 && book.numChapters >0){
            return false;
          }
          return true;
        };

        booksGrid =function (volume) {
            return htmlDiv({
              classKey:CLASS_BOOKS,
              content: booksGridContent(volume)
            });
        };

        booksGridContent = function (volume) {
              let gridContent = "";

              volume.books.forEach(function (book) {
                  gridContent += htmlLink({
                      classKey: CLASS_BUTTON,
                      id: book.id,
                      href: `#${volume.id}:${book.id}`,
                      content: book.gridName
                  });
              });

              return gridContent;
          };

        cacheBooks= function(callback){
            volumes.forEach(function (volume){
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
        htmlAnchor = function (volume) {
            return `<a name="v${volume.id}" />`;
        };

        htmlDiv = function (parameters) {
            let classString = "";
            let contentString = "";
            let idString = "";

            if (parameters.classKey !== undefined) {
                classString = ` class="${parameters.classKey}"`;
            }

            if (parameters.content !== undefined) {
                contentString = parameters.content;
            }

            if (parameters.id !== undefined) {
                idString = ` id="${parameters.id}"`;
            }

            return `<div${idString}${classString}>${contentString}</div>`;
        };

        htmlElement = function (tagName, content) {
            return `<${tagName}>${content}</${tagName}>`;
        };

        htmlLink = function (parameters){
          let classString="";
          let contentString= "";
          let hrefString="";
          let idString="";

          if(parameters.classKey !== undefined){
              classString=` class="${parameters.classKey}"`;
          }

          if(parameters.content !== undefined){
              contentString= parameters.content;
          }

          if(parameters.href !== undefined){
              hrefString= ` href="${parameters.href}"`;
          }
          if(parameters.id !== undefined){
              idString = ` id="${parameters.id}"`;
          }

          return `<a${idString}${classString}${hrefString}>${contentString}</a>`;
        };

        initMap= function(){
          console.log("hola in inimap");
          map = new google.maps.Map(document.getElementById("map"), {
             center: {lat: 31.778332, lng: 35.232113},
             zoom: 10
          });
        };

        init = function(callback){
          let booksLoaded=false;
          let volumesLoaded=false;
          initMap();
          ajax(URL_BOOKS,function(data){
                  // console.log("Loaded Books from Server");
                  // console.log(data);
                  books=data;
                  booksLoaded=true;
                  if(volumesLoaded){
                    cacheBooks(callback);
                  }

                }
          );
          ajax(URL_VOLUMES,function(data){
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
        navigateBook = function(bookId){
          console.log("navigateBook"+ bookId);
        };
        navigateChapter = function(bookId, chapter){
          console.log("navigateChapter"+ bookId +", "+ chapter);
        };

        navigateHome = function (volumeId) {
          document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
              id: DIV_SCRIPTURES_NAVIGATOR,
              content: volumesGridContent(volumeId)
          });
        };

        onHashChanged = function () {
            let ids=[];
            if (location.hash !== "" && location.hash.length >1) {
              ids=location.hash.slice(1).split(":");
            }
            if (ids.length <= 0) {
              navigateHome();
            }else if (ids.length === 1){
              let volumeId =Number(ids[0]);
              if(volumeId < volumes[0].id || volumeId > volumes.slice(-1).id){
                  navigateHome();
              }else{
                navigateHome(volumeId);
              }
            }else if(ids.length >= 2){
              let bookId =Number(ids[1]);
              if(books[bookId]=== undefined){
                  navigateHome();
              }else {
                if(ids.length ===2){
                  navigateBook(bookId);
                }else{
                  let chapter=Number(ids[2]);
                  if(bookChapterValid(bookId, chapter)){
                    navigateChapter(bookId, chapter);
                  } else{
                      navigateHome();
                  }
                }
              }

            }
            console.log("The hash is " + location.hash);

        };

        volumesGridContent = function (volumeId) {
            let gridContent = "";

            volumes.forEach(function (volume) {
                if (volumeId === undefined || volumeId === volume.id) {
                    gridContent += htmlDiv({
                        classKey: CLASS_VOLUME,
                        content: htmlAnchor(volume) + htmlElement(TAG_VOLUME_HEADER, volume.fullName)
                    });

                    gridContent += booksGrid(volume);
                }
            });

            return gridContent + BOTTOM_PADDING;
          };

       /*-----------------------------------------------------------------
        *                  PUBLIC API
        */

        return {
          init,
          initMap,
          onHashChanged
        };
  }())

// Scriptures.init_map();
//Document.querySelectorAll(
  //"a[onclick^=\"showLocation(\"]").forEach(function(element){
//})"
// /showlocation\(.*)
