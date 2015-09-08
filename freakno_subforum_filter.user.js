// ==UserScript==
// @id             freakno_subforum_filter
// @name           freak.no Subforum Filter
// @version        1.0
// @namespace      robhol.net
// @author         robhol
// @description    
// @include        *freak.no/*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.2.6/jquery.js
// @run-at         document-end
// ==/UserScript==

// ==Config==
//block lists support strings (exact match) or regex objects.

var subforumBlockList = [ 
    //List of subforums to remove - applies to front page, forum listing, KP list

    "Research Chemicals",
    "Legal highs",
    /^Rus/,
    /Utvalgte rusforumtråderg?/ //trailing "g" occurs, for some reason, only in "promoted topics"
];

var categoryBlockList = [
    //list of entire categories to remove from forum listing
    //will NOT remove forums recursively

    "Rusforum"
];

var userBlock = null; // function(jQueryElement) for custom blocking behavior

// ==/Config==

function isMatch(exp, subject) { return (typeof(exp) == "string" || exp instanceof String) ? exp == subject : exp.test(subject); }

function isBlocked(blockList, subject) { 
    return blockList.some( function(exp) {
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

function frontPageRemoval() {

    //recent activity
    $("tbody#collapseobj_module_5 tr").slice(1).each(function() {
        var trSubforum = $(this).children("td:last-child").text();

        if (isBlocked(subforumBlockList, trSubforum))
            block($(this));
    });

    //promoted topics
    $("tbody#collapseobj_module_20 table tbody tr").each(function() {
        var trSubforum = $(this).find("td:first-child").attr("title"); 

        if (isBlocked(subforumBlockList, trSubforum))
            block($(this));
    })

}

function forumListRemoval() {

    //subforum rows
    $("div.contentWrapper tbody[id^=collapseobj_forumbit_] tr[valign=top]").each(function() {
        var sub = $(this).find("td:nth-child(2) a[href^=forumdisplay] strong").text();
        if (isBlocked(subforumBlockList, sub))
            block($(this));
    });

    //categories
    $("div.contentWrapper tbody:has(tr:has(td.tcat))").each(function() { 
        var tbodiesCategory = $(this).find("td.tcat > a").text(); 

        if(isBlocked(categoryBlockList, tbodiesCategory))
            block($(this).next("tbody").andSelf());

    });

}

function kpListRemoval() {

    $("div.contentWrapper tbody tr").slice(2).each(function() {
        var trSubforum = $(this).find("td:nth-child(6) a").text();

        if (isBlocked(subforumBlockList, trSubforum))
            block($(this));
    });

}

$(document).ready(function(){

    definePageAction("/", frontPageRemoval);
    definePageAction("/forum/", forumListRemoval);
    definePageAction("/forum/kvalitetspoeng.php", kpListRemoval);

});
