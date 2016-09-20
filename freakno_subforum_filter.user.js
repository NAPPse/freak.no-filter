// ==UserScript==
// @id             freakno_subforum_filter
// @name           freak.no Filter
// @version        1.1.2
// @namespace      robhol.net
// @author         robhol
// @description    
// @include        *freak.no/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @run-at         document-end
// @grant          GM_getValue
// @grant          GM_setValue
// ==/UserScript==

// ==Config==
//block lists support strings (exact match) or regex objects.


var subforumBlockList = [ 
    //List of subforums to remove - applies to front page, forum listing, KP list
    //case sensitive unless specified as /subforum name/i

    "Research Chemicals",
    "Legal highs",
    "Andre stoffer",
    /^Rus/,
    /Utvalgte rusforumtråderg?$/ //trailing "g" occurs, for some reason, only in "promoted topics"
];

var categoryBlockList = [
    //list of entire categories to remove from forum listing in /forum/ and /forum/search.php
    //will NOT remove content from subforums belonging to this category.

    "Rus"
];

var threadBlockList = [
    //list of individual threads to remove from search results and forum views

    //"Emnetittel her"
];

var removeFromRecentTopics          = true;

var removeFromPromotedTopics        = true;

var removeFromMyMostRecentTopics    = true;

var removeFromKPListing             = true;

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

function getFrontPageTableByHeader(x) {
    return $("table.tborder:has(thead:contains('" + x + "'))");
}

function cleanFrontPageTable(headerContains, subforumSelector) {
    
    getFrontPageTableByHeader(headerContains).find("tr.thread.recthreads-row").each(function() {
        
        var self = $(this);
        var trThreadTitle = self.find("a[id^=thread_title_]").text();
        var trSubforum    = subforumSelector(self);
        
        if (matchesList(subforumBlockList, trSubforum) || matchesList(threadBlockList, trThreadTitle))
            block(self);
    });
}

function frontPageHandler() {

    if (removeFromRecentTopics) {
        cleanFrontPageTable("Siste aktivitet", function(tr) {
            return tr.find(".btn-forum").text();
        });
    }
    
    var sideTableSubforumSelector = function(tr) {
        return tr.find(".cat-sml-f-frontpage").attr("title");
    };
    
    if (removeFromPromotedTopics)
        cleanFrontPageTable("Promoterte", sideTableSubforumSelector);
    
    if (removeFromMyMostRecentTopics)
        cleanFrontPageTable("Mine siste emner", sideTableSubforumSelector);
    
    //add config button
    var configbutton = $("<a>Konfigurer filtre</a>");
    configbutton.attr("id", "filter-config-button");
    configbutton.addClass("btn btn-sml btn-grey");
    
    $("table.footer-stuff td.tfoot a:last-child").after(" - ", configbutton);
    
    //add config form
    var configform = $('<form></form>');
    configform.attr("id", "filter-config-form");
    configform.hide();
    
    // $("table.footer-stuff").after(configform);
}

function forumListHandler() {

    //categories
    $("div.contentWrapper tbody:has(tr:has(.theadcat))").each(function() { 
        var tbodiesCategory = $(this).find("td.theadcat > a").text(); 

        if(matchesList(categoryBlockList, tbodiesCategory))
            block($(this).next("tbody").andSelf());

    });

    //subforum rows
    $("div.contentWrapper tbody[id^=collapseobj_forumbit_] tr[valign=top]").each(function() {
        var trSubforum = $(this).find("td:nth-child(2) a[href^=forumdisplay] strong").text();
        if (matchesList(subforumBlockList, trSubforum))
            block($(this));
    });
    
    parseForumList($("body"))

}

function forumDisplayHandler() {

    $("#threadslist tbody[id^=threadbits_forum_] tr:not(:has(td.thead))").each(function() { 
        var trThreadTitle = $(this).find("a[id^=thread_title_]").text();
        if (matchesList(threadBlockList, trThreadTitle))
            block($(this));
    });

}

function kpListHandler() {

    if (!removeFromKPListing)
        return;

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
        $("select[name^=forumchoice] option[class^=fjdpth]:not(.fjdpth0)").each(function (){
            var optionSubforum = $(this).text().replace(/^\s+/, "");

            if (matchesList(subforumBlockList, optionSubforum))
                $(this).remove();

        });
    }

    if (isResultView && removeFromSearchResults) {
        //threads view
        $("#threadslist tr").slice(2, -1).each(function(){ 
            var trThreadTitle = $(this).find("td:nth-child(3) a[id^=thread_title]").text();
            var trSubforum = $(this).find("td:nth-child(7) a[href^=forumdisplay]").text();

            if (matchesList(subforumBlockList, trSubforum) || matchesList(threadBlockList, trThreadTitle))
                block($(this));
        });
        
        //posts view
        $("table.tborder[id^=post]").each(function(){ 
            var trThreadTitle = $(this).find("a[href^=showthread] strong").text();
            var trSubforum = $(this).find(".thead a[href^=forumdisplay]").text();
            console.log("["+trSubforum+"]["+trThreadTitle+"]")

            if (matchesList(subforumBlockList, trSubforum) || matchesList(threadBlockList, trThreadTitle))
                block($(this));
        });
    }

}

function showConfig() {
 
    
}



$(document).ready(function(){

    definePageAction("/", frontPageHandler);
    definePageAction("/forum/", forumListHandler);
    definePageAction("/forum/search.php", searchPageHandler);
    definePageAction("/forum/forumdisplay.php", forumDisplayHandler);
    definePageAction("/forum/kvalitetspoeng.php", kpListHandler);
    
    $("#filter-config-button").click(showConfig);

});
