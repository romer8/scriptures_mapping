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
/*global console, XMLHttpRequest, google, map */
/*property
    Animation, DROP, Marker, animation, books, classKey, content, exec, forEach,
    fullName, getAttribute, getElementById, gridName, hash, href, id, init,
    innerHTML, lat, length, lng, log, map, maps, maxBookId, minBookId,
    numChapters, onHashChanged, onerror, onload, open, parse, position, push,
    querySelectorAll, response, send, setMap, slice, split, status, title,
    tocName,Point, labelOrigin, origin, url, icon, label, text, color,
    fontSize,fontWeight, LatLngBounds, reduce
*/
//MAKE A GLOBAL FOR NEXT CHAPTER, AND ANOTHER FOR PREVIOUS CHAPTERS
const Scriptures=(function(){
  "use strict";
      /*-----------------------------------------------------------------
       *                   CONSTANT
       */
       const BOTTOM_PADDING="<br /><br />";
       const CLASS_BOOKS="books";
       const CLASS_BUTTON="btn";
       const CLASS_CHAPTER="chapter";
       const CLASS_VOLUME="volumes";
       const CLASS_PREVNEXT_BUTTTON= "nextprev";
       const CLASS_NAV_HEADING="navheading";
       const CLASS_NAV_HEADING_ICONS="material-icons";
       const CONTENT_PREVIOUS_ICON="skip_previous";
       const CONTENT_NEXT_ICON="skip_next";
       const DEFAULT_ZOOM = 10;
       const DEFAULT_ZOOM_JERUSALEM = 8;
       const DIV_SCRIPTURES_NAVIGATOR="scripnav";
       const DIV_SCRIPTURES="scriptures";
       const INDEX_FLAG = 11;
       const INDEX_LATITUDE = 3;
       const INDEX_LONGITUDE = 4;
       const INDEX_PLACENAME = 2;
       const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
       const MAX_RETRY_DELAY= 5000;
       const REQUEST_GET= "GET";
       const REQUEST_STATUS_OK =200;
       const REQUEST_STATUS_ERROR = 400;
       const TAG_VOLUME_HEADER = "h5" ;
       const TAG_ICONS="i" ;
       const URL_BOOKS= "https://scriptures.byu.edu/mapscrip/model/books.php";
       const URL_SCRIPTURES = "https://scriptures.byu.edu/mapscrip/mapgetscrip.php";
       const URL_VOLUMES= "https://scriptures.byu.edu/mapscrip/model/volumes.php";
       const URL_ICON ="https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png";

       /*-----------------------------------------------------------------
        *                  PRIVATE VARIABLE
        */
        let books;
        let gmMarkers=[];
        let retryDelay =500;
        let volumes;
        let actual_book;
        let actual_chapter;
       /*-----------------------------------------------------------------
        *                  PRIVATE METHOD DECLARATIONS
        */
        let addMarker;
        let ajax;
        let bookChapterValid;
        let booksGrid;
        let booksGridContent;
        let cacheBooks;
        let changeZoom;
        let chaptersGrid;
        let chaptersGridContent;
        let clearMarker;
        let encodedScripturesUrlParameters;
        let getScripturesCallback;
        let getScripturesFailure;
        // let filterMarker;
        let htmlAnchor;
        let htmlDiv;
        let htmlElement;
        let htmlLink;
        let iconAction;
        let init;
        let initMap;
        let navigateBook;
        let navigateChapter;
        let navigateHome;
        let nextChapter;
        let onHashChanged;
        let previousChapter;
        let prevNext;
        let setupMarkers;
        let titleForBookChapter;
        let volumesGridContent;

       /*-----------------------------------------------------------------
        *                  PRIVATE METHODS
        */



        addMarker = function(placename, latitude, longitude){

          let marker = new google.maps.Marker({
              position: {lat: Number(latitude), lng: Number(longitude)},
              icon: {
                  url:URL_ICON ,
                  labelOrigin: new google.maps.Point(15, 55)
              },
              label: {
                text: placename,
                color: "#4c4c4c",
                fontSize: "20px",
                fontWeight: "bold"
              },
              map,
              title: placename,
              animation: google.maps.Animation.DROP
          });


          gmMarkers.push(marker);
        };

        ajax= function (url,successCallback, failureCallback, skipJsonParse) {
            let request = new XMLHttpRequest();
            request.open(REQUEST_GET, url, true);

            request.onload = function() {
                if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                  // Success!
                  let data = (
                    skipJsonParse
                    ? request.response
                    : JSON.parse(request.response)
                  );
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

        changeZoom = function(){
          let bounds = new google.maps.LatLngBounds();

          let gmMarkers_unique = gmMarkers.reduce(function (unique, o){
              if(!unique.some(obj => obj.title === o.title)) {
                unique.push(o);
              }
              return unique;
          },[]);


          if(gmMarkers_unique.length >= 1 ){
            gmMarkers.forEach(function(lmarker){
              bounds.extend(lmarker.getPosition());

            })
            map.fitBounds(bounds);
            if(gmMarkers_unique.length == 1){
              map.setZoom(DEFAULT_ZOOM);
            }
          }
          else{
            map.setCenter({lat: 31.777444, lng: 35.234935});
            map.setZoom(DEFAULT_ZOOM_JERUSALEM);
          }
        };

        chaptersGrid = function (book){
            return htmlDiv({
                classKey:CLASS_VOLUME,
                content: htmlElement(TAG_VOLUME_HEADER, book.fullName)
            }) + htmlDiv({
                classKey: CLASS_BOOKS,
                content: chaptersGridContent(book)
            });
        };

        chaptersGridContent = function(book){
          let gridContent= "";
          let chapter = 1;
          while (chapter <= book.numChapters) {
              gridContent += htmlLink({
                classKey: `${CLASS_BUTTON} ${CLASS_CHAPTER}`,
                id: chapter,
                href: `#0:${book.id}:${chapter}`,
                content:chapter
              });

              chapter += 1;
          }

          return gridContent;
        };

        clearMarker= function () {
          gmMarkers.forEach(function (marker) {
            marker.setMap(null);
          });
          gmMarkers =[];
        };

        encodedScripturesUrlParameters= function (bookId, chapter,verses, isJst) {
          actual_book=bookId;
          actual_chapter=chapter;
          if(bookId !== undefined && chapter !== undefined){
            let options = "";
            if (verses !== undefined) {
                options += verses;
            }
            if(isJst !== undefined){
              options += "&jst=JST";
            }
            return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
          }
        };

        getScripturesCallback = function(chapterHtml){
            document.getElementById(DIV_SCRIPTURES).innerHTML=chapterHtml;

            setupMarkers();

            prevNext();
        };

        getScripturesFailure = function () {
            console.log("Unable to retrieve chapter content from server. ");
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

        htmlElement = function (tagName,content,classString,idString) {

          if(idString == undefined && classString == undefined){ //addition
            return `<${tagName}>${content}</${tagName}>`;
          }//addition
          if(classString !==undefined){
            let class_item= ` class=${classString}`;
            return `<${tagName}${class_item}>${content}</${tagName}>`;
          }
          //addition
          if(idString !==undefined){
            let id_item= ` id=${idString}`;
            return `<${tagName}${id_item}>${content}</${tagName}>`;
          }
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



        init = function(callback){
          let booksLoaded=false;
          let volumesLoaded=false;
          // initMap();
          ajax(URL_BOOKS,function(data){

                  books=data;
                  booksLoaded=true;
                  if(volumesLoaded){
                    cacheBooks(callback);
                  }

                }
          );
          ajax(URL_VOLUMES,function(data){

                  volumes=data;
                  volumesLoaded=true;
                  if(booksLoaded){
                    cacheBooks(callback);
                  }

                }
          );

        };
        navigateBook = function(bookId){
            let book =books[bookId];
            if(book.numChapters <= 1){
              navigateChapter(book.id, book.numChapters);
            } else{
                document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
                  id:DIV_SCRIPTURES_NAVIGATOR,
                  content: chaptersGrid(book)
                });
            }

        };
        navigateChapter = function(bookId, chapter){
          ajax(encodedScripturesUrlParameters(bookId, chapter),getScripturesCallback,
              getScripturesFailure, true);
        };

        navigateHome = function (volumeId) {
          document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
              id: DIV_SCRIPTURES_NAVIGATOR,
              content: volumesGridContent(volumeId)
          });
        };

        nextChapter = function (bookId, chapter) {
            let book = books[bookId];

            if(book !== undefined){
                if(chapter< book.numChapters){
                  return [
                    bookId,
                    chapter +1,
                    titleForBookChapter(book, chapter + 1)
                  ];
                }

              let nextBook = books[bookId+1];

              if(nextBook !== undefined){
                let nextChapterValue =0;

                if(nextBook.numChapters > 0){
                  nextChapterValue = 1;
                }

                return [
                  nextBook.id,
                  nextChapterValue,
                  titleForBookChapter(nextBook, nextChapterValue)
                ];
              }
          }

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

        };
        previousChapter = function (bookId, chapter) {
            //HW IS THIS ONE
            let book = books[bookId];
            if(book !== undefined){

                if(chapter !== 1 && chapter <= book.numChapters){
                  return [
                    bookId,
                    chapter -1,
                    titleForBookChapter(book, chapter - 1)
                  ];
                }
              let prevBook = books[bookId-1];

              if(prevBook !== undefined){
                let prevChapterValue =0;

                if(prevBook.numChapters > 0){
                  prevChapterValue = prevBook.numChapters;
                }

                return [
                  prevBook.id,
                  prevChapterValue,
                  titleForBookChapter(prevBook, prevChapterValue)
                ];
              }
          }
        };
        iconAction = function(chapterCallback){

          let arrayChapter = chapterCallback(actual_book, actual_chapter);
          if(arrayChapter !== undefined){
            let book_id=arrayChapter[0];
            let chapter_id= arrayChapter[1];
            let volumeId =location.hash.slice(1).split(":")[0];
            let url="#"+volumeId+":"+book_id+":"+chapter_id;
            window.location.hash=url
          }
        };

        prevNext= function (){

          let element_content =htmlDiv({
            classKey:CLASS_PREVNEXT_BUTTTON,
            content:htmlLink({
              content:htmlElement("i",CONTENT_PREVIOUS_ICON,CLASS_NAV_HEADING_ICONS)
            })+htmlLink({
              content:htmlElement("i",CONTENT_NEXT_ICON, CLASS_NAV_HEADING_ICONS)
            })
          });

          let onlyClassArray= document.getElementsByClassName(CLASS_NAV_HEADING);

          Array.from(onlyClassArray).forEach(function(onlyClass){
            onlyClass.innerHTML += element_content;
          });

          let icon_Elements= document.getElementsByClassName(CLASS_NAV_HEADING_ICONS);
          let icon_prevs =Array.prototype.filter.call(icon_Elements, function(icon_Element){
              return icon_Element.innerHTML === CONTENT_PREVIOUS_ICON;
          });
          let icon_next=Array.prototype.filter.call(icon_Elements, function(icon_Element){
              return icon_Element.innerHTML === CONTENT_NEXT_ICON;
          });

          icon_prevs.forEach(function(element){
            element.addEventListener("click",function(){
              iconAction(previousChapter);
            });
          });
          icon_next.forEach(function(element){
            element.addEventListener("click",function(){
              iconAction(nextChapter);
            });
          });

        };



        setupMarkers = function(){
          if(window.google === undefined){
              let retryId = window.setTimeout(setupMarkers, retryDelay);
              retryDelay += retryDelay;

              if(retryDelay > MAX_RETRY_DELAY){
                  window.clearTimeout(retryId);
              }
              return;
          }
          if (gmMarkers.length > 0) {
            clearMarker();

          }

          document.querySelectorAll("a[onclick^=\"showLocation(\"]").forEach(function(element){
              let matches=LAT_LON_PARSER.exec(element.getAttribute("onclick"));
              if(matches){
                let placename=matches[INDEX_PLACENAME];
                let latitude =matches [INDEX_LATITUDE];
                let longitude =matches [INDEX_LONGITUDE];
                let flag = matches[INDEX_FLAG];

                if(flag !== ""){
                    placename += ` ${flag}`;
                }

                addMarker(placename, latitude, longitude);
              }
          });

          let indexPositions = [];
          let indexPositions_delete=[];
          for(let i=0; i<gmMarkers.length; ++i){
            for(let j=0; j< gmMarkers.length; ++j){
                if((gmMarkers[i].getTitle() != gmMarkers[j].getTitle()) && (!indexPositions.includes(j))){
                  if(gmMarkers[i].getPosition().equals(gmMarkers[j].getPosition())){
                      let newLabel= gmMarkers[i].getTitle() + ", " + gmMarkers[j].getTitle();
                      let objectLabel= gmMarkers[i].getLabel();

                      // if(objectLabel.text.indexOf(gmMarkers[j].getTitle()) > -1) {
                      //   objectLabel.text += ", " + gmMarkers[j].getTitle();
                      //   gmMarkers[i].setLabel(objectLabel);
                      // }
                      objectLabel.text += ", " + gmMarkers[j].getTitle();
                      gmMarkers[i].setLabel(objectLabel);

                      indexPositions.push(j);
                      if(!indexPositions_delete.includes(i) && !indexPositions.includes(i)){
                        indexPositions_delete.push(i);
                      }
                  }
              }
            }
          }


          for(let i=0;i < gmMarkers.length; i++ ){
            if(indexPositions.includes(i) && !indexPositions_delete.includes(i)){
              gmMarkers[i].setMap(null);
            }
          };



          changeZoom();
        };

        titleForBookChapter = function (book, chapter) {
            //Return a string that describes this chapter useful when hovering for a tooltip//
            if(book !== undefined){
                if(chapter > 0){
                  return `${book.tocName} ${chapter}`;
                }
                return book.tocName;
            }
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
          onHashChanged,
        };
  }())
