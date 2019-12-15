// index.js
/*
Script built in Puppeteer and JavaScript, then migrated to Node using Cheerio and Axios for requests
*/

const cheerio = require('cheerio')
const axios = require('axios')

axios.get('https://www.finextra.com/channel/blockchain').then((response) => {

  const $ = cheerio.load(response.data)

  let linksArr = [];
  const blogWords = ['blog', 'cryptocurrency', 'blockchain', 'fintech','libra'];
  const badBlogWords = ['..', '...', '»'];

  const capit = (s) => {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
      }

  let aLink = $('a');
  for( let i=1; i < aLink.length; i++ ){
      if ($("a").parent().is("h"+i)) {
          $( "h"+i ).each(function( index ) {
              if( $( "h"+i ).has("a")){

                  let linkText =  $( this ).text();
                  let linkTextLC = linkText.toLowerCase();
                  let linkLink =  $("a", this ).attr("href");

                  
                  if( (linkText != undefined && linkText != null && linkTextLC != "") &&
                      (linkLink != undefined && linkLink != null && linkLink != ""))
                      {
                          let blogWorthy= blogWords.some(o => linkTextLC.includes(o));
                          let blogUnworthy= badBlogWords.some(o => linkText.includes(o));
                          if(blogWorthy ){
                              if(! blogUnworthy ){

                                  linksArr.push({
                                      "Title" : linkText,
                                      "Link" : linkLink
                                  });

                              }
                          }
                      }
              } 		
          });
      }
  }

  linksArr.forEach(element => {
      console.log( element );
  });
})