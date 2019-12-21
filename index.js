// index.js
/*
Script built in Puppeteer and JavaScript, then migrated to Node using Cheerio and Axios for requests
*/

const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs');

const blogUrls = [
    "https://www.lexblog.com/site/global-fintech-payments-blog/",
    "https://www.linklaters.com/en/insights/blogs/fintechlinks",
    "https://patthomson.net/category/research-project/",
    "https://www.pentasecurity.com/blog/page/2/",
    "https://blogs.deloitte.ch/banking/",
    "https://www.fca.org.uk/insight/",
    "https://www.bissresearch.com/",
    "https://www.coindesk.com/",
    "https://www.newsbtc.com/"
];

let linkText = "";
let linkTextLC = "";
let linkLink = "";

let linksArr = [];
let jsonContent = {};

const capit = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

let getLinks = (linkTextP, linkTextLCP, linkLinkP) => {

    linkText = linkTextP;
    linkTextLC = linkTextLCP;
    linkLink = linkLinkP;

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
                linksArr.push({
                    "Title": linkText,
                    "Link": linkLink
                });

            }
        }
    }
} //end fun

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
                        if (
                            $("a", this).attr("class") && (
                                $("a", this).attr('class').indexOf('post') > -1 ||
                                $("a", this).attr('class').indexOf('title') > -1
                            ) ||
                            $(this).attr("class") && (
                                $(this).attr('class').indexOf('post') > -1 ||
                                $(this).attr('class').indexOf('title') > -1
                            )
                        ) {
                            linkText = $(this).text();
                            linkTextLC = linkText.toLowerCase();
                            linkLink = $("a", this).attr("href");

                            getLinks(linkText, linkTextLC, linkLink);
                        }
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

                            getLinks(linkText, linkTextLC, linkLink);
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