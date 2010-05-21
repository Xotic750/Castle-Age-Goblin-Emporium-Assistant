// ==UserScript==
// @name           Castle Age Goblin Emporium Assistant
// @namespace      Goblin
// @include        http://apps.facebook.com/castle_age/goblin_emp.php*
// @exclude        *#iframe*
// @require        http://cloutman.com/jquery-latest.min.js
// @require        http://github.com/Xotic750/Castle-Age-Goblin-Emporium-Assistant/raw/master/jquery-ui-1.8.1/js/jquery-ui-1.8.1.custom.min.js
// @version        1.0.0
// @license        GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @compatability  Firefox 3.0+, Chrome 4+, Flock 2.0+
// ==/UserScript==

/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global $,GM_xmlhttpRequest,window,unsafeWindow,confirm,GM_registerMenuCommand,XPathResult */

"use strict";

var Goblin = {
    version: '1.0.0',

    check_update: function (currentVersion) {
        var request = new GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://github.com/Xotic750/Castle-Age-Goblin-Emporium-Assistant/raw/master/Chrome/Castle-Age-Goblin-Emporium-Assistant.user.js',
            headers: {'Cache-Control': 'no-cache'},
            onload: function (resp) {
                var remote_version = new RegExp("@version\\s*(.*?)\\s*$", "m").exec(resp.responseText)[1];
                if (remote_version > currentVersion) {
                    if (confirm("There is a newer version of this script available.  Would you like to update?")) {
                        setTimeout(function () {
                            unsafeWindow.location.href = "http://github.com/Xotic750/Castle-Age-Goblin-Emporium-Assistant/raw/master/Chrome/Castle-Age-Goblin-Emporium-Assistant.user.js";
                        }, 3000);
                    }
                }
            }
        });
    },

    goblin_dialog: null,

    doIterations: 0,

    doIterationsReq: 0,

    doItem: {
        name  : null,
        image : null,
        id    : null,
        cntId : null,
        count : null,
        max   : null
    },

    ge_dialog: $("<div id='goblin_dialog' title='Castle Age Goblin Emporium Assistant'></div>"),

    message: $("<div id='goblin_dialog_message'></div>").css({
        width     : 'auto',
        margin    : '5px'
    }),

    control: $("<div id='goblin_dialog_control'></div>").css({
        width     : 'auto',
        margin    : '5px'
    }),

    progress: $("<div id='goblin_dialog_progress'></div>").css({
        height    : '5px',
        width     : 'auto',
        margin    : '5px'
    }).progressbar().attr("title", "Progress: 0%"),

    status: $("<div id='goblin_dialog_status'></div>").css({
        height    : '10%',
        width     : 'auto',
        margin    : '5px',
        border    : 'solid 1px black',
        padding   : '5px',
        overflowX : 'hidden',
        overflowY : 'scroll'
    }).attr("title", "Displays the status messages"),

    itemlog: $("<div id='goblin_dialog_itemlog'></div>").css({
        height    : '50%',
        width     : 'auto',
        margin    : '5px',
        border    : 'solid 1px black',
        padding   : '5px',
        overflowX : 'hidden',
        overflowY : 'scroll'
    }).attr("title", "Displays the received items and their attributes."),

    writeStatus: function (message) {
        var now = new Date(),
            t_hour = now.getHours(),
            t_min = now.getMinutes(),
            t_sec = now.getSeconds(),
            time = "00:00:00",
            lineStat = $('<div></div>').css({
                width     : 'auto'
            }),
            timeDiv = $('<div></div>').css({
                width     : '15%',
                display   : 'inline-block'
            }),
            messDiv = $('<div></div>').css({
                width     : '80%',
                display   : 'inline-block'
            });

        t_hour = t_hour + "";
        if (t_hour.length === 1) {
            t_hour = "0" + t_hour;
        }

        t_min = t_min + "";
        if (t_min.length === 1) {
            t_min = "0" + t_min;
        }

        t_sec = t_sec + "";
        if (t_sec.length === 1) {
            t_sec = "0" + t_sec;
        }

        time = t_hour + ':' + t_min + ':' + t_sec;
        lineStat.prepend(timeDiv.html(time + '\f'), messDiv.html(message + '\f'));
        this.status.prepend(lineStat);
    },

    theItems: [],

    fillItems: function () {
        $('.ingredientUnit[style*="display: block"]').each(function (index) {
            var itemName = $(this).find('img:first').attr('title'),
                itemImg  = $(this).find('img:first').attr('src'),
                clickId  = $(this).attr('id'),
                cntId    = clickId.replace(/gout_/, 'gout_value_'),
                itemCnt  = Number($(this).find('#' + cntId).text()),
                itMax    = Math.floor(itemCnt / 10);

            if (itemCnt >= 10) {
                Goblin.theItems.push({
                    name  : itemName,
                    image : itemImg,
                    id    : clickId,
                    cntId : cntId,
                    count : itemCnt,
                    max   : itMax
                });
            }
        });
    },

    chooser: function () {
        var selectItem = $("<select name='Items' id='Items'></select>").attr("title", "Select the alchemy piece to exchange."),
            selectFreq = $("<select name='Iterations' id='Iterations'></select>").attr("title", "Select the number of iterations for the exchange."),
            buttonSub  = $("<button>GO!</button>").button().attr("title", "Click when you are ready to begin the exchange."),
            freq       = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

        this.goblin_dialog = $("#goblin_dialog");
        if (!this.goblin_dialog.length) {
            this.goblin_dialog = Goblin.ge_dialog;
            Goblin.message.html("Select alchemy piece and iterations...").appendTo(this.goblin_dialog);
            Goblin.control.appendTo(this.goblin_dialog);
            $("<div>Progress</div>").css({margin: '5px'}).appendTo(this.goblin_dialog);
            Goblin.progress.appendTo(this.goblin_dialog);
            $("<div>Status</div>").css({margin: '5px'}).appendTo(this.goblin_dialog);
            Goblin.status.appendTo(this.goblin_dialog);
            $("<div>Received Items</div>").css({margin: '5px'}).appendTo(this.goblin_dialog);
            Goblin.itemlog.appendTo(this.goblin_dialog);
            this.goblin_dialog.prependTo(document.body).dialog({
                resizable  : false,
                height     : 460,
                width      : 580,
                zIndex     : 99999,
                dialogClass: "cagefix"
            });

            $('.cagefix.ui-dialog').css({position: "fixed"});
        }

        if (this.goblin_dialog.length) {
            Goblin.fillItems();
            $.each(Goblin.theItems, function (index) {
                selectItem.append("<option value='" + index + "'>" + this.name + " : (" + this.count + ")</option>");
            });

            $.each(freq, function (index) {
                selectFreq.append("<option value='" + this + "'>" + this + "</option>");
            });

            buttonSub.click(function () {
                Goblin.progress.progressbar("option", "value", 0).attr("title", "Progress: 0%");
                Goblin.doIterations = Number(selectFreq.val());
                Goblin.doItem = Goblin.theItems[$(":selected", selectItem).attr("value")];
                if (Goblin.doItem.max < Goblin.doIterations && Goblin.doItem.max > 0 && Goblin.doIterations > 0) {
                    Goblin.writeStatus('Too many iterations requested, setting to max ' + Goblin.doItem.max + '!');
                    Goblin.doIterations = Goblin.doItem.max;
                }

                Goblin.doIterationsReq = Goblin.doIterations;
                Goblin.writeStatus('Exchanging ' + Goblin.doIterations * 10 + ' of ' + Goblin.doItem.name + '.');
                Goblin.doIt();
            });

            Goblin.control.html("");
            Goblin.control.append(selectItem, selectFreq, buttonSub);
        }
    },

    clickImg: function (imageName) {
        if (imageName) {
            var imgObj = document.evaluate(".//img[contains(translate(@src,'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + imageName + "')]", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (imgObj && imgObj.singleNodeValue) {
                this.click(imgObj.singleNodeValue);
            }
        }
    },

    clickItem: function (id) {
        if (id) {
            var obj = document.getElementById(id);
            if (obj) {
                this.click(obj);
            }
        }
    },

    click: function (obj) {
        if (obj) {
            var evt = document.createEvent("MouseEvents");
            if (evt) {
                evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                obj.dispatchEvent(evt);
            }
        }
    },

    itemsNeeded: 10,

    checkCount: function () {
        Goblin.itemsNeeded = Number($('#app46755028429_gin_left_amt').text());
    },

    doNext: function () {
        this.doItem.count = Number($('#' + this.doItem.cntId).text());
        this.doItem.max = Math.floor(this.doItem.count / 10);
        if (this.doIterations > 0) {
            if (this.doItem.max >= this.doIterations) {
                this.doIt();
            } else if (this.doItem.max > 0 && this.doIterations > 0) {
                this.writeStatus('Too many iterations requested, setting to max ' + this.doItem.max + '!');
                this.doIterations = this.doItem.max;
                this.doIt();
            } else {
                this.writeStatus('Ran out of ' + this.doItem.name + '!');
                this.chooser();
            }
        } else {
            this.writeStatus('Finished run for ' + this.doItem.name + '.');
            this.chooser();
        }
    },

    feedback: function (e) {
        if (/goblin/.test(e.target.id)) {
            var theItem = {
                    name    : null,
                    attack  : null,
                    defence : null,
                    bonus   : null
                },
                tempVar = null,
                logline = $("<div></div>").css({
                    width     : '100%'
                }),
                logName = $('<div></div>').css({
                    width     : '30%',
                    display   : 'inline-block'
                }),
                logAttack = $('<div></div>').css({
                    width     : '5%',
                    display   : 'inline-block'
                }),
                logDefense = $('<div></div>').css({
                    width     : '5%',
                    display   : 'inline-block'
                }),
                logBonus = $('<div></div>').css({
                    width     : '50%',
                    display   : 'inline-block'
                }),
                percentage = 0;

            tempVar = $.trim($('#app46755028429_single_popup_content_feedback').text()).replace(/\s+/g, " ").split("!");
            tempVar[0] = tempVar[0].replace(/You've been awarded with /, "");
            theItem.bonus = tempVar[1].replace(/ Bonus: /, "");
            tempVar = tempVar[0].replace(/[\[\]]/g, '|').split('|');
            theItem.name = $.trim(tempVar[0]);
            tempVar = tempVar[1].split('/');
            theItem.attack = Number(tempVar[0]);
            theItem.defence = Number(tempVar[1]);
            logline.append(
                logName.html(theItem.name + '\f'),
                logAttack.html(theItem.attack + '\f'),
                logDefense.html(theItem.defence + '\f'),
                logBonus.html(theItem.bonus + '\f')
            );

            Goblin.itemlog.prepend(logline);
            percentage = 100 - (Goblin.doIterations / Goblin.doIterationsReq) * 100;
            Goblin.progress.progressbar("option", "value", percentage).attr("title", "Progress: " + percentage + "%");
            Goblin.itemsNeeded = 10;
            $('#app46755028429_gin_left_amt').bind('DOMNodeInserted', Goblin.checkCount);
            window.setTimeout(function () {
                Goblin.clickImg("publish_button_skip.gif");
                Goblin.doNext();
            }, 5000 + Math.floor(Math.random() * 2000));
        } else if (/app46755028429_results_container/.test(e.target.id)) {
            Goblin.writeStatus('Something went wrong, trying again!');
            Goblin.doIterations += 1;
            Goblin.itemsNeeded = 10;
            $('#app46755028429_gin_left_amt').bind('DOMNodeInserted', Goblin.checkCount);
            window.setTimeout(function () {
                Goblin.doNext();
            }, 5000 + Math.floor(Math.random() * 2000));
        }
    },

    safetyCatch: true,

    doIt: function () {
        var tid = window.setTimeout(function () {
                Goblin.safetyCatch = false;
                Goblin.writeStatus('Implimented safteycatch!');
            }, 6000);

        while (this.itemsNeeded > 0 && this.safetyCatch) {
            this.clickItem(this.doItem.id);
        }

        window.clearTimeout(tid);
        this.safetyCatch = true;
        this.clickImg('emporium_button.gif');
        this.doIterations -= 1;
    },

    init: function () {
        var checkCSS = $('link[href*="jquery-ui-1.8.1.custom.css"'),
            menu = null;
        if (!checkCSS.length) {
            $("<link>").appendTo("head").attr({
                rel: "stylesheet",
                type: "text/css",
                href: "http://github.com/Xotic750/Castle-Age-Goblin-Emporium-Assistant/raw/master/jquery-ui-1.8.1/css/smoothness/jquery-ui-1.8.1.custom.css"
            });
        }

        $('#app46755028429_gin_left_amt').bind('DOMNodeInserted', this.checkCount);
        $('#app46755028429_globalContainer').bind('DOMNodeInserted', this.feedback);

        if (navigator.userAgent.toLowerCase().indexOf('chrome') !== -1 ? true : false) {
            window.setTimeout(function () {
                Goblin.chooser();
            }, 1000);
        } else {
            this.check_update(this.version);
            menu = new GM_registerMenuCommand("Castle Age Goblin Emporium Assistant", this.chooser);
        }
    }
};

$(function () {
    Goblin.init();
});