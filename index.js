// index.js
function main() {

    const cheerio = require('cheerio');
    const axios = require('axios');
    const fs = require('fs');
    const urlMetadata = require('url-metadata');

    const mysql  = require('mysql');
    const config = require('./config.js');

    const getArchiveUrls = require("./json/archiveUrls");

    let blogUrls = [];

    let linkText = "";
    let linkTextLC = "";
    let linkLink = "";

    let linksArr = [];
    let jsonContent = {};

    const capit = (s) => {
        if (typeof s !== 'string') return ''
        return s.charAt(0).toUpperCase() + s.slice(1)
    }

    let getLinks = (linkTextP, linkTextLCP, linkLinkP, linkDomainP) => {

        linkText = linkTextP;
        linkTextLC = linkTextLCP;
        linkLink = linkLinkP;
        linkDomain = linkDomainP;

        if (linkLink != undefined) {
            linkLink = linkLink.replace(/^\/+/, '');
            if (!linkLink.includes("http")) {
                if (!linkLink.includes("www")) {
                    linkLink = `https://${linkDomain}/${linkLink}`
                } else {
                    linkLink = `https://${linkLink}`
                }
            }
        }

        let blogWorthy = false;
        let blogUnworthy = false;

        const blogWords = [
            'bitcoin', 'btc', 'eth', 'litecoin', 'ltc', 'dash', 'xmr', 'monero', 'nxt', 'etc', 'doge', 'zec', 'xrp', 'ripple', 'blockchain',
            'dlt', 'crypto', 'xlm', 'stellar', 'xvg', 'verge', 'ada', 'cardano', 'tether', 'usdt', 'bch', 'eos', 'bnb', 'binance',
            'atom', 'link', 'neo', 'maker', 'ontology', 'bat', 'quantum', 'zrx', 'nano', 'satoshi', 'bakkt', 'digital asset', 'ico',
            'hodl', 'exchange', 'tron'
        ];

        function escapeHtml(unsafe) {
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
         }

        const badBlogWords = ['..', '...', '»', ' · '];

        if ((linkText != undefined && linkText != null && linkTextLC != "") &&
            (linkLink != undefined && linkLink != null && linkLink != "")) {
            blogWorthy = blogWords.some(o => linkTextLC.includes(o));
            blogUnworthy = badBlogWords.some(o => linkText.includes(o));
            if (blogWorthy) {
                if (!blogUnworthy) {

                    let getDescription = urlMetadata(linkLink, {
                        maxRedirects: 5,
                        timeout: 2000,
                        descriptionLength: 170
                    }).then(
                        function (metadata) { // success handler
                            return metadata;
                        },
                        function (error) { // failure handler
                            return "No description";
                        }
                    )

                    getDescription.then(
                        function (des) {
                        let desT = "";
                        let desU = "";
                        if (des.title != undefined) {
                            desT = des.title.split('|')[0];
                            desT = escapeHtml(desT);

                            desU = des.url.split('|')[0];
                            desU = escapeHtml(desU);
                        }
                            let desD = des.description + "...";
                            desD = escapeHtml(desD);
                            let index = linksArr.findIndex(x => x.Title == desT);
                            let publishDate = des["article:published_time"];

                            if (publishDate == "" || publishDate == null || publishDate == undefined) {
                                let d = new Date();
                                d.setDate(d.getDate() - 5);
                                publishDate = d;
                            }
                            const connection = mysql.createConnection(config);
                            if (index === -1) {
                                console.log(1);
                                if (desT != null && desT != "") {
                                    let sql = "INSERT INTO `cryptourlentries` (`urlTitle`,`urlLink`,`urlDescription`,`urlSource`,`urlDate`) VALUES ('"+desT+"','"+desU+"','"+desD+"','"+des.source+"','"+publishDate+"')";
                                    connection.query(sql);
                                }
                            }
                            connection.end();

                        }
                    )
                }
            }
        }
    } //end fun

    blogUrls = getArchiveUrls.returnArchiveUrls();

    let contents = fs.readFileSync("./json/urls.json");
    if (contents.length != 0) {
        jsonContent = JSON.parse(contents);
    } else jsonContent = linksArr;

    //Loop through blog post archive urls
    for (let r = 0; r < blogUrls.length; r++) {
        try {
            axios.get(blogUrls[r]).then((response) => {
                const $ = cheerio.load(response.data)

                //Anchor tags with span sibling
                if ($("a").prev("span")) {
                    $("span").next("a").each(function (index) {
                        if ($(this).prev("span")) {
                            linkText = $(this).prev().text();
                            linkTextLC = linkText.toLowerCase();
                            linkLink = $(this).attr("href");
                            let linkDomain = new URL(blogUrls[r]).hostname;
                            if (!linkLink.includes("bitcointicker")) {
                                getLinks(linkText, linkTextLC, linkLink, linkDomain);
                            }
                        }

                    });
                }

                //Span tags with anchor parent
                if ($("a").children(':first-child').is("span")) {
                    $("a").each(function (index) {
                        if ($(this).has("span")) {
                            if (
                                $(this).attr("class") && (
                                    $(this).attr('class').indexOf('post') > -1 ||
                                    $(this).attr('class').indexOf('title') > -1
                                )
                            ) {

                                linkText = $(this).parent().text();
                                linkTextLC = linkText.toLowerCase();
                                linkLink = $(this).attr("href");
                                let linkDomain = new URL(blogUrls[r]).hostname;

                                getLinks(linkText, linkTextLC, linkLink, linkDomain);
                            }
                        }

                    });
                }

                for (let i = 1; i <= 6; i++) {
                    //Anchor tags with header parent
                    if ($("a").parent().is("h" + i)) {
                        $("h" + i).each(function (index) {
                            if ($(this).has("a")) {

                                linkText = $(this).text();
                                linkTextLC = linkText.toLowerCase();
                                linkLink = $("a", this).attr("href");
                                let linkDomain = new URL(blogUrls[r]).hostname;

                                getLinks(linkText, linkTextLC, linkLink, linkDomain);
                            }

                        });
                    }

                    //Header tags with anchor parent

                    if ($("h" + i).parent().is("a")) {
                        $("a").each(function (index) {
                            if ($(this).has("h" + i)) {
                                if (
                                    $("h" + i, this).attr("class") && (
                                        $("h" + i, this).attr('class').indexOf('post') > -1 ||
                                        $("h" + i, this).attr('class').indexOf('title') > -1
                                    ) ||
                                    $(this).attr("class") && (
                                        $(this).attr('class').indexOf('post') > -1 ||
                                        $(this).attr('class').indexOf('title') > -1
                                    )
                                ) {
                                    linkText = $(this).text();
                                    linkTextLC = linkText.toLowerCase();
                                    linkLink = $(this).attr("href");
                                    let linkDomain = new URL(blogUrls[r]).hostname;

                                    getLinks(linkText, linkTextLC, linkLink, linkDomain);
                                }
                            }
                        });
                    }

                } //End for loop




            })
        } catch (err) {
            console.log("main cheerio failed");
            return 0;
        }
    }

    let ts = new Date();
    console.log("Script executed at: " + ts.toISOString());
    return 1;

}

main(); //Wrapped in main to prevent memory leaks