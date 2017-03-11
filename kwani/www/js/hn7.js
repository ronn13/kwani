/*global Framework7, Dom7, Template7, moment, hnapi */

(function (Framework7, $$, T7, moment, hnapi) {
    'use strict';

    // Helpers
    T7.registerHelper('time_ago', function (time) {
        return moment.unix(time).fromNow();
    });
    T7.registerHelper('array_length', function (arr) {
        return arr ? arr.length : 0;
    });
    T7.registerHelper('pluralize', function (arr, options) {
        return (arr.length === 1) ? options.hash.single : arr.length + " " + options.hash.multiple;
    });
    T7.registerHelper('notEmpty', function (value) {
        return value || 0;
    });

    var app, mainView, leftView, splitView, allowCommentsInsert;

    // Init App
    app = new Framework7({
        modalTitle: 'Kwani',
        animateNavBackIcon: true,
        precompileTemplates: true,
        template7Pages: true,
        externalLinks: 'a.external, .message a',
        router: false
    });

    // Add Right/Main View
    mainView = app.addView('.view-main', {
        dynamicNavbar: true,
        animatePages: false,
        swipeBackPage: true,
        reloadPages: true,
        preloadPreviousPage: false
    });

    // Update stories on PTR
    $$('.pull-to-refresh-content').on('refresh', function () {
        $$('.refresh-link.refresh-home').addClass('refreshing');
        getStories(true);
    });
    $$('.refresh-link.refresh-home').on('click', function () {
        var clicked = $$(this);
        if (clicked.hasClass('refreshing')) {
            return;
        }
        clicked.addClass('refreshing');
        getStories(true);
    });
    
    app.onPageInit('item', function (page) {
        if (page.view === mainView) {
            getComments(page);
        }
        getUserInfo(page);
    });
    
    app.onPageAfterAnimation('item', function (page) {
        if (page.view === mainView) {
            getComments(page);
        }
    });
        
    $$(document).on('click', '.message a', function (e) {
        e.preventDefault();
        window.open($$(this).attr('href'));
    });

    // Search HN
    function updateOnSearch(results, limit) {
        if (results.length === limit) {
            // Reset search filter
            $$('.page[data-page="index"]').find('.searchbar-not-found').hide();
            $$('.page[data-page="index"]').find('.searchbar-not-found').html("Not Found");
            $$('.page[data-page="index"]').find('.searchbar-found').show();
            // Clear Empty Object in list
            results = results.filter(function (n) {
                return n !== null;
            });
            // reset .refresh-icon if necessary
            $$('.refresh-link.refresh-home').removeClass('refreshing');
            // Render page stories
            updateStories(results);
        }
    }
    
    $$('.page[data-page="index"] input[type="search"]').on('keyup', function (e) {
        if (e.keyCode === 13) {
            $$('.refresh-link.refresh-home').addClass('refreshing');
            $$('.page[data-page="index"]').find('.searchbar-not-found').html("Searching throw HN...");
            hnapi.search(this.value, function (data) {
                var results = [],
                    limit = 20;
                data = JSON.parse(data);
                data.hits.forEach(function (item, i) {
                    hnapi.item(item.objectID, function (data) {
                        data = JSON.parse(data);
                        if (data) {
                            data.domain = data.url ? data.url.split('/')[2] : '';
                        }
                        results[i] = data;
                        updateOnSearch(results, limit);
                    }, function (err) {
                        limit -= 1;
                        updateOnSearch(results, limit);
                    });
                });
            });
        }
    });
    $$('.page[data-page="index"] .searchbar-cancel').on('click', function () {
        updateStories(JSON.parse(window.localStorage.getItem('stories')) || []);
    });

    // Export app to global
    window.app = app;

}(Framework7, Dom7, Template7, moment, hnapi));