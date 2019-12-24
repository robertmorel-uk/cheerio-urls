// index.js
/*
Script built in Puppeteer and JavaScript, then migrated to Node using Cheerio and Axios for requests
*/

process.env.UV_THREADPOOL_SIZE = 10000;
require('events').EventEmitter.defaultMaxListeners = 10000;

const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs');
const urlMetadata = require('url-metadata')

const getArchiveUrls = require("./json/archivUrls");

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

    const blogWords = ['blog', 'cryptocurrency', 'crypterium', 'blockchain', 'fintech', 'libra', 'equity', 'bank', 'research', 'MiFid', 'data', 'hacking', 'bitcoin'];

    const badBlogWords = ['..', '...', '»', ' · '];

    if ((linkText != undefined && linkText != null && linkTextLC != "") &&
        (linkLink != undefined && linkLink != null && linkLink != "")) {
        blogWorthy = blogWords.some(o => linkTextLC.includes(o));
        blogUnworthy = badBlogWords.some(o => linkText.includes(o));
        if (blogWorthy) {
            if (!blogUnworthy) {

                let getDescription = urlMetadata(linkLink).then(
                    function (metadata) { // success handler
                        return metadata;
                    },
                    function (error) { // failure handler
                        console.log(error)
                    }
                )

                getDescription.then(
                    function (des) {
                        linksArr.push({
                            "Title": des.title,
                            "Link": des.url,
                            "Description": des.description,
                            'image': des.image,
                            'author': des.author,
                            'keywords': des.keywords,
                            'source': des.source
                        })
                    }
                )




            }
        }
    }
} //end fun

blogUrls = getArchiveUrls.returnArchiveUrls();

let contents = fs.readFileSync("json/urls.json");
if (contents.length != 0) {
    jsonContent = JSON.parse(contents);
} else jsonContent = linksArr;

//Loop through blog post archive urls
for (let r = 0; r < blogUrls.length; r++) {
    axios.get(blogUrls[r]).then((response) => {
        const $ = cheerio.load(response.data)

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

        fs.writeFile(
            './json/urls.json',
            JSON.stringify(linksArr, null, 2),
            (err) => err ? console.error('Data not written!', err) : console.log('Data written!')
        )

    })
}