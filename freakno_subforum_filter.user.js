// ==UserScript==
// @id             freakno_subforum_filter
// @name           freak.no Subforum Filter
// @version        1.0
// @namespace      robhol.net
// @author         robhol
// @description    
// @include        *freak.no/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @run-at         document-end
// ==/UserScript==

// ==Config==
//block lists support strings (exact match) or regex objects.

var subforumBlockList = [ 
    //List of subforums to remove - applies to front page, forum listing, KP list
    //case sensitive unless specified as /subforum name/i

    "Research Chemicals",
    "Legal highs",
    /^Rus/,
    /Utvalgte rusforumtråderg?$/ //trailing "g" occurs, for some reason, only in "promoted topics"
];

var categoryBlockList = [
    //list of entire categories to remove from forum listing in /forum/ and /forum/search.php
    //will NOT remove content from subforums belonging to this category.

    "Rusforum"
];

var removeFromSearchForumListing    = true; //if true, blocked categories, subforums (and their posts) will be removed from search forum listing (not results).
                                            //note that custom blocking behavior will be ignored for these results.
var removeFromSearchResults         = true; //if true, posts belonging to blocked subforums will be removed from search results

var userBlock = null; // function(jQueryElement) for custom blocking behavior

// ==/Config==

var RE_SEARCH_RESULTS = /searchid=\d+/;

function isMatch(exp, subject) { return (typeof(exp) == "string" || exp instanceof String) ? exp == subject : exp.test(subject); }

function matchesList(list, subject) { 
    return list.some( function(exp) {
        return isMatch(exp, subject);
    });
}

function definePageAction(applicableLocation, f) {
    if (applicableLocation == document.location.pathname.replace(/\/?index\.(php|html?)$/i, ""))
        f();
}

function defaultBlock(e) {
    e.remove();
}

function block(e) {
    ( userBlock || defaultBlock )(e);
}

function frontPageHandler() {

    //recent activity
    $("tbody#collapseobj_module_5 tr").slice(1).each(function() {
        var trSubforum = $(this).children("td:last-child").text();

        if (matchesList(subforumBlockList, trSubforum))
            block($(this));
    });

    //promoted topics
    $("tbody#collapseobj_module_20 table tbody tr").each(function() {
        var trSubforum = $(this).find("td:first-child").attr("title"); 

        if (matchesList(subforumBlockList, trSubforum))
            block($(this));
    })

}

function forumListHandler() {

    //categories
    $("div.contentWrapper tbody:has(tr:has(td.tcat))").each(function() { 
        var tbodiesCategory = $(this).find("td.tcat > a").text(); 

        if(matchesList(categoryBlockList, tbodiesCategory))
            block($(this).next("tbody").andSelf());

    });

    //subforum rows
    $("div.contentWrapper tbody[id^=collapseobj_forumbit_] tr[valign=top]").each(function() {
        var sub = $(this).find("td:nth-child(2) a[href^=forumdisplay] strong").text();
        if (matchesList(subforumBlockList, sub))
            block($(this));
    });

}

function kpListHandler() {

    $("div.contentWrapper tbody tr").slice(2).each(function() {
        var trSubforum = $(this).find("td:nth-child(6) a").text();

        if (matchesList(subforumBlockList, trSubforum))
            block($(this));
    });

}

function searchPageHandler() {

    var isResultView = RE_SEARCH_RESULTS.test(document.location.search);

    if (!isResultView && removeFromSearchForumListing) {
        //categories
        $("select[name^=forumchoice] option.fjdpth0").each(function (){
            var optionCategory = $(this).text().replace(/^\s+/, "");

            if (matchesList(categoryBlockList, optionCategory))
                $(this).nextUntil(".fjdpth0").andSelf().remove();

        });

        //subforums
        $("select[name^=forumchoice] option.fjdpth1").each(function (){
            var optionSubforum = $(this).text().replace(/^\s+/, "");

            if (matchesList(subforumBlockList, optionSubforum))
                $(this).remove();

        });
    }

    if (isResultView && removeFromSearchResults) {
        $("#threadslist tr").slice(2, -1).each(function(){ 
            var trSubforum = $(this).find("td:nth-child(7) a[href^=forumdisplay]").text();
            var title = $(this).find("td:nth-child(3) a[id^=thread_title]").text();

            if (matchesList(subforumBlockList, trSubforum))
                block($(this));
        })
    }

}

$(document).ready(function(){

    definePageAction("/", frontPageHandler);
    definePageAction("/forum/", forumListHandler);
    definePageAction("/forum/search.php", searchPageHandler);
    definePageAction("/forum/kvalitetspoeng.php", kpListHandler);

});
