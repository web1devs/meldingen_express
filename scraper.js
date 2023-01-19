var $ = require(`./tools`)

var CACHE = {
  id: {
    dienst:     {},
    provincie:  {},
    regio:      {},
    stad:       {},
    categorie:  {}
  },
  name: {
    dienst:     {},
    provincie:  {},
    regio:      {},
    stad:       {},
    categorie:  {}
  }
}
async function Main() {
  await $.Connect()
  await cacheDB()
  var previousid = null
  if (require('fs').existsSync('./lastid.json')) {
	try {
		previousid = JSON.parse(require('fs').readFileSync('./lastid.json'));
	} catch (err) {
		previousid = null;
	}
  }
  console.log(previousid)
  scrapeP2000(previousid)
  //nieuws hieronder function is normal uit
  scrapeNieuws()
}

async function scrapeP2000(LastID = null) {
  try {
    var meldingen = []
    var options = {
      url: 'https://monitor.p2000alarm.nl',
      jar: $.Jar(),
      headers: {
        'Referer': 'https://monitor.p2000alarm.nl'
      }
    }
    var html = await $.Request(options)
    options.url = `https://monitor.p2000alarm.nl/ReadMonitor3.php?LastID=${LastID}`
    var html = await $.Request(options)

    // console.log(html)

    html    = html.split('<D>')
   
    LastID  = html[3]

    require('fs').writeFileSync('./lastid.json', JSON.stringify(LastID))
    html    = html[0].split('<M>')
    var conn = await $.Connection()
    for (var p2000 of html) {
      var dom     = $.Cheerio(`<table>${p2000}</table>`)

     


      var $table  = dom('table')
      var obj     = {}
      obj.p2000     = $table.find('tr:first-child > td:last-child').text()

      // checked working 
      obj.straat     = $table.find('.pAdrV').text()
      if (!obj.straat.contains(',')) {
        continue
      }
      obj.stad        = obj.straat.split(',')[1].slug()
      obj.straat      = obj.straat.split(',')[0].trim()
      obj.straat_url  = obj.straat.slug()

     //checked working


      var datum       = $table.find('tr:first-child > td:first-child').text()

  

      var time        = $table.find('tr:nth-child(3) > .pTime').text()
      obj.timestamp   = $.Unix(`${datum} ${time}`, `DD-MM-YYYY HH:mm`)
      var dienst      = $table.find('tr:first-child > td:last-child').attr('class')
      obj.dienst      = (dienst == 'pDisA') ? 'ambulance' : (dienst == 'pDisB') ? 'brandweer' : (dienst == 'pDisP') ? 'politie' : (dienst == 'pDisK') ? 'kustwacht' : 'politie'
      var prio        = $table.find('tr:first-child > td:nth-child(2)').attr('class')
      obj.prio       = (prio == 'Prio1') ? 1 : (prio == 'Prio2') ? 2 : 3
      obj.prio       = (obj.p2000.includes('grip')) ? 4 : obj.prio // ramp grote ingrijp
      obj.lat         = null
      obj.lng         = null
      
   
      //checked worked

      // var json        = await $.Request(`https://maps.googleapis.com/maps/api/geocode/json?address=${obj.straat},${obj.stad},netherlands&key=xxxxxxxxx`)
     
      // if (json.results.length > 0) {
      //   obj.lat = json.results[0].geometry.location.lat
      //   obj.lng = json.results[0].geometry.location.lng
      // }

      
      obj.categorie = await findCategory(obj)

    
    

 
      if (obj.categorie && !CACHE.id.categorie[obj.categorie.slug()]) {
        var results = await $.Query(conn, 'insert into categorie set ?', {id: null, categorie: obj.categorie, categorie_url: obj.categorie.slug()})
        CACHE.id.categorie[obj.categorie.slug()]  = results.insertId
        CACHE.name.categorie[results.insertId]    = obj.categorie
      }
      if (obj.categorie) {
        obj.categorie = CACHE.id.categorie[obj.categorie.slug()]
      }


     
      obj.eenheden  = []
      $table.find('tr').each((i, el) => {
        try {
          if (i < 2) {
            return true
          }
          $tr                   = dom(el)
          var eenheid           = {}
          eenheid.capcode	      = $tr.find('td:nth-child(1) > a').text().trim()
          eenheid.omschrijving  = $tr.find('td:nth-child(3) > a:last-child').text().trim().replace('�', '')
          var capdienst         = $tr.find('td:nth-child(1) > a').attr('class').trim()
          eenheid.dienst         = (capdienst == 'pCapA') ? 'ambulance' : (capdienst == 'pCapB') ? 'brandweer' : (capdienst == 'pCapP') ? 'politie' : (capdienst == 'pCapK') ? 'kustwacht' : 'politie' // pDisN
          eenheid.regio         = $tr.find('td:nth-child(3) > a:first-child').text().slug()
          if (eenheid.omschrijving.toLowerCase().matches(['traumaheli', 'lifeliner', 'mmt'])) {
            obj.dienst     = 'traumaheli'
            eenheid.dienst = 'traumaheli'
          }
          obj.eenheden.push(eenheid)
          

        } catch (err) {
          console.log(err)
        }
      })
      meldingen.push(obj)

    
     
    }
    // tijd voor DB insert/updates en rotzooi
    for (var melding of meldingen) {
      if (!CACHE.id.stad[melding.stad]) {
        console.log('Stad niet gevonden in database: ' + melding.stad)
        continue
      }
      var rows = await $.Query(conn, 'select * from stad where stad_url = ?', [melding.stad])
      if (rows.length === 0) {
        console.log('Stad niet gevonden in database: ' + melding.stad)
        continue
      }
      melding.provincie = rows[0].provincie
      melding.regio     = rows[0].regio
      melding.stad      = rows[0].id

      var post = [null, melding.p2000, melding.straat, melding.straat_url, melding.lat, melding.lng, melding.dienst, melding.prio, melding.timestamp, melding.categorie, melding.provincie, melding.regio, melding.stad];
     
      
      var results = await $.Query(conn, 'insert ignore into melding (id, p2000, straat, straat_url, lat, lng, dienst, prio, timestamp, categorie, provincie, regio, stad) VALUES (?, ?, ?, ?, ?, ?, (select id from dienst where dienst = ?), ?, ?, ?, ?, ?, ?)', post)
      melding.id = results.insertId
      console.log(melding.id);
      for (var eenheid of melding.eenheden) {
        var rows = await $.Query(conn, 'select * from capcode where capcode = ?', [eenheid.capcode])
        if (rows.length > 0) {
          eenheid.id = rows[0].id
        } else {
          var post = [null, eenheid.capcode, eenheid.omschrijving, eenheid.dienst, eenheid.regio]
          var rows = await $.Query(conn, 'insert into capcode (id, capcode, omschrijving, dienst, regio) VALUES (?, ?, ?, (select id from dienst where dienst = ?), (select id from regio where regio_url = ?))', post)
          eenheid.id = rows.insertId
        }
        var post = [null, melding.id, eenheid.id]
        var rows = await $.Query(conn,'insert into eenheden (id, melding, capcode) VALUES (?, ?, ?)', post);
      }
    }
    $.Release(conn)
  } catch (err) {
    console.log(err)
  } // 10 sec = 10 * 1000
  setTimeout(scrapeP2000, 10 * 900, LastID)
}

//news scrap

async function scrapeNieuws() {
  try {
    var articles = []
    var results = await $.Request('https://www.politie.nl/nieuws')

   
    var dom = $.Cheerio(results)
    dom('#main-content > section > section.listing-overzicht > div > a').each(async (i, el) => {
      var obj       = {}
      var $article  = dom(el)
      obj.source    = `https://politie.nl${$article.attr('href')}`
      var datetime  = $article.find('time').attr('datetime')
      obj.timestamp = $.Unix(`${datetime.split(' ')[0]} ${datetime.split(' ')[1]}`, `DD-MM-YYYY HH:mm`)
      obj.title     = $article.find('h3').text()

     

      obj.title_url = obj.title.slug()
      obj.stad_url  = $article.find('p').text().split('/')[0].slug()
    
      if (obj.stad_url == 'den-bosch') {
        obj.stad_url = 's-hertogenbosch'
      }
      articles.push(obj)

      
    })
    for (var article of articles) {
      var rows = await $.Query('select * from stad where stad_url = ?', [article.stad_url])
      if (rows.length === 0) {
        console.log('Nieuws: stad niet gevonden in database: ' + article.stad_url)
        return true
      }
      article.provincie = rows[0].provincie
      article.regio     = rows[0].regio
      article.stad      = rows[0].id
      var rows = await $.Query('select * from nieuws where source = ?', [article.source])
      if (rows.length === 0) {
        var results   = await $.Request(article.source)
        var dom         = $.Cheerio(results)
        article.intro = dom('#main-content > article > header > p').text().trim().split(/- (.+)/)[1]
        article.story = dom('#main-content > article > div').html().trim().replace(/<\s*([a-z][a-z0-9]*)\s.*?>/gi, '<$1>').replace(/  +/g, ' ').replace(/  |\r\n|\n|\r/gm, '');
        article.media = dom('#main-content > article > img').attr('data-interchange') || null
        if (article.media) {
          article.media = article.media.split(',')[0].replace('[', '')
        }
        var post = [null, article.title, article.title_url, article.intro, article.story, article.source, article.media, article.timestamp, article.provincie, article.regio, article.stad]
        var rows = await $.Query('insert into nieuws (id, title, title_url, intro, story, source, media, timestamp, provincie, regio, stad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', post)
      }
    }
    // now what?
    // check if exist
  } catch (err) {
    console.log(err)
  } //10 min
  setTimeout(scrapeNieuws, 10 * 60 * 1000)
}

//end news Scraper


async function cacheDB() {
  var conn = await $.Connection()
  for (var row of await $.Query(conn, 'select * from dienst')) {
    CACHE.id.dienst[row.dienst] = row.id
    CACHE.name.dienst[row.id] = row.dienst
  }
  for (var row of await $.Query(conn, 'select * from provincie')) {
    CACHE.id.provincie[row.provincie_url] = row.id
    CACHE.name.provincie[row.id] = row.provincie
  }
  for (var row of await $.Query(conn, 'select * from regio')) {
    CACHE.id.regio[row.regio_url] = row.id
    CACHE.name.regio[row.id] = row.regio
  }
  for (var row of await $.Query(conn, 'select * from stad')) {
    CACHE.id.stad[row.stad_url] = row.id
    CACHE.name.stad[row.id] = row.stad
  }
  for (var row of await $.Query(conn, 'select * from categorie')) {
    CACHE.id.categorie[row.categorie_url] = row.id
    CACHE.name.categorie[row.id] = row.categorie
  }
  $.Release(conn)
  setTimeout(cacheDB, 30 * 60 * 1000)
}
async function findCategory(obj, c = null) {
  var p = obj.p2000.replace(obj.straat, '').toLowerCase() // remove adres and tolower
 
  p = p.replace(obj.stad.replace(/-/g, ' '), '') // remove city with spaces
  p = p.replace(obj.stad, '') // remove city
  p = p.replace(/\d{5,10}/gm, '') // replace ritnumbers 5 or higher
  p = p.replace(/\d{4}[a-z]{2}/gmi, '') // replace postal codes 3242KK
  p = p.replace('obj:', '') // remove obj:
  p = p.replace('rit:', '')
  //p = p.replace(/:|[(]|[)]|[*]|\\|[/]/gi, ' ')
  p = p.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ' ')
  p = p.replace(/\s\s+/g, ' ')
  var prio = obj.prio
  p = p.toLowerCase()

  

  if (obj.prio == 1 && obj.dienst == 'ambulance') {
    // a1
    var cats = [
      'Mogelijk in levensgevaar',
      'Ambulance spoedurgentie',
      'Ambulance onderweg met spoed',
      'Noodgeval ambulance onderweg',
      'Levensgevaar ambulance onderweg'
    ]
    c = cats[$.Random(0, cats.length - 1)]
    if (p.matches('woonzorgcentrum'))
      c = 'Levensgevaar woonzorgcentrum'
    if (p.matches('hap'))
      c = 'Levensgevaar huisartsenpost'
  }
  if (obj.prio == 2 && obj.dienst == 'ambulance') {
    // a2
    c = 'Ambulance met gepaste spoed'
    if (p.matches('vws'))
      c = 'Herpositioneren (paraatstelling)'
    if (p.matches('huisarts'))
      c = 'Ambulance naar huisarts'
    if (p.matches('verzorgingshuis'))
      c = 'Ambulance naar verzorgingshuis'
    if (p.matches('moskee'))
      c = 'Melding vanuit moskee'
    if (p.matches('parkeergarage'))
      c = 'Ambulance naar parkeergarage'
  }
  if (obj.prio == 3 && obj.dienst == 'ambulance') {
    // b1 b2
    c = 'Besteld vervoer'
    if (p.matches('b1'))
      c = 'Besteld vervoer met medicatie'
    if (p.matches('b2'))
      c = 'Besteld vervoer zonder medicatie'
    if (p.matches('cardiologie'))
      c = 'Besteld vervoer cardiologie'
    if (p.matches('intensive care'))
      c = 'Besteld vervoer intensive care'
  }
  if (p.matches(['dia', 'directe inzet']) && obj.dienst == 'ambulance') {
    // dia
    var cats = [
      'Burgermelding voor ambulance',
      'Directe inzet ambulance',
      'Ambulance in gesprek met melder'
    ]
    c = cats[$.Random(0, cats.length - 1)]
  }
  if (p.matches('jacht') && p.matches('mast'))
    c = 'Jacht met gebroken mast'
  if (p.matches('fabriek'))
    c = 'Fabrieksongeluk'
  if (p.matches('b-rit'))
    c = 'Besteld vervoer'
  if (p.matches('uitslaand'))
    c = 'Uitslaande brand melding'
  if (p.matches('arrestantenzorg'))
    c = 'Zorg voor arrestanten'
  if (p.matches(['dv', 'dienstverlening']))
    c = 'Dienstverlening verzoek'
  if (p.matches('contact '))
    c = 'Graag contact meldkamer'
  if (p.matches(['veront.', 'verontreinigd']) && p.matches('water'))
    c = 'Verontreinigd water'
  if (p.matches('herbezetting'))
    c = 'Herbezetting brandweer'
  if (p.matches('bodemverontr'))
    c = 'Bodemverontreiniging'
  if (p.matches('gedumpt afval'))
    c = 'Gedumpt afval'
  if (p.matches(['nabulussen', 'nablussen']))
    c = 'Nablussen brand'
  if (p.matches('incident'))
    c = 'Incident'
  if (p.matches(['grip ', ' grip']))
    c = 'Grote ingrijp'
  if (p.matches('gezondheid'))
    c = 'Gezondheidskwestie'
  if (p.matches('totale post'))
    c = 'Alarm voor totale post'
  if (p.matches('aardgas'))
    c = 'Aardgas geconstateerd'
  if (p.matches('vrijhouden'))
    c = 'Vrijhouden voor hulpdiensten'
  if (p.matches('lekk. gev. stof'))
    c = 'Lekkage gevaarlijke stoffen'
  if (p.matches('leefmilieu'))
    c = 'Milieu melding'
  if (p.matches('loos alarm'))
    c = 'Loos alarm'
  if (p.matches('slagboom'))
    c = 'Probleem met slagboom'
  if (p.matches('voertuig') && p.matches('van de weg'))
    c = 'Voertuig van de weg'
  if (p.matches('controle'))
    c = 'Controle'
  if (p.matches('oefening'))
    c = 'Oefening'
  if (p.matches(['testalarm', 'test alarm']))
    c = 'Test alarm'
  if (p.matches('schietpartij'))
    c = 'Schietpartij'
  if (p.matches('fge contact'))
    c = 'Contact met lijkschouwer'
  if (p.matches(['afstemverzoek', 'afstem verzoek', 'bel mkob']))
    c = 'Graag contact meldkamer'
  if (p.matches('b-rit') && p.matches(['verpleeghuis', 'zorg']))
    c = 'Besteld vervoer verpleeghuis'
  if (p.matches('b-rit') && p.matches('huisarts'))
    c = 'Besteld vervoer huisartspraktijk'
  if (p.matches('b-rit') && p.matches(['cardiologie', 'cardio']))
    c = 'Besteld vervoer cardiologie'
  if (p.matches('b-rit') && p.matches('long'))
    c = 'Besteld vervoer long afdeling'
  if (p.matches('reinigen wegdek'))
    c = 'Reinigen wegdek'
  if (p.matches('pech'))
    c = 'Pechgeval'
  if (p.matches('stormschade'))
    c = 'Stormschade'
  if (p.matches('stormschade') && p.matches('boom'))
    c = 'Stormschade (boom)'
  if (p.matches('overval'))
    c = 'Overval'
  if (p.matches(['stank', 'hinder']))
    c = 'Stank (geurhinder)'
  if (p.matches('meting'))
    c = 'Meetonderzoek'
  if (p.matches('meting') && p.matches('stank'))
    c = 'Meetonderzoek (stank/hinder)'
  if (p.matches('kennisgeving') && p.matches('intern'))
    c = 'Kennisgeving intern'
  if (p.matches('koolmonoxide'))
    c = 'Meting koolmonoxide'
  if (p.matches('bijzondere verkeerszaken'))
    c = 'Bijzondere verkeerszaken'
  if (p.matches('uitval'))
    c = 'Energie of gas uitval'
  if (p.matches('voertuig') && p.matches('water'))
    c = 'Voertuig te water'
  if (p.matches('wateroverlast'))
    c = 'Wateroverlast'
  if (p.matches(['schip', 'watersp']))
    c = 'Schip in problemen'
  if (p.matches('persalarm'))
    c = 'Persalarm'
  if (p.matches('verlaat persalarm'))
    c = 'Vertraagd persalarm'
  if (p.matches('buitensluiting'))
    c = 'Persoon buitengesloten'
  if (p.matches('steekpartij'))
    c = 'Steekpartij'
  if (p.matches('letsel'))
    c = 'Ongeval met letsel'
  if (p.matches('letsel') && p.matches('fabriek'))
    c = 'Fabrieksongeval met letsel'
  if (p.matches('aanrijding'))
    c = 'Aanrijding'
  if (p.matches('aanrijding') && p.matches('letsel'))
    c = 'Aanrijding met letsel'
  if (p.matches('aanrijding') && p.matches('wild'))
    c = 'Aanrijding wild dier'
  if (p.matches('eigen initiatief'))
    c = 'Eigen initiatief'
  if (p.matches(['stremming', 'verkeersstremming']))
    c = 'Wegverkeer stremming'
  if (p.matches(['liftopsluiting', 'opsluiting']))
    c = 'Liftopsluiting'
  if (p.matches('vechtpartij'))
    c = 'Vechtpartij'
  if (p.matches('nachtopvang'))
    c = 'Ambulance naar nachtopvang'
  if (p.matches('persoon te water'))
    c = 'Persoon te water'
  if (p.matches('zwemmer'))
    c = 'Zwemmer in problemen'
  if (p.matches('surfer'))
    c = 'Surfer in problemen'
  if (p.matches('gaslucht'))
    c = 'Gaslucht'
  if (p.matches('dienst aan derden'))
    c = 'Assistentie aan derden'
  if (p.matches('bewaakt'))
    c = 'Bewaakte rit'
  if (p.matches('ob rit'))
    c = 'Bewaakte rit'
  if (p.matches('ob rit') && p.matches('politiebureau'))
    c = 'Bewaakte rit naar politiebureau'
  if (p.matches('ogs'))
    c = 'Bestrijding gevaarlijke stoffen'
  if (p.matches(['gaslek', 'gaslekkage', 'gas lekkage']))
    c = 'Gaslekkage'
  if (p.matches('seh'))
    c = 'Naar spoedeisende hulp'
  if (p.matches('seh') && p.matches('bewaakt'))
    c = 'Naar spoedeisende hulp (bewaakt)'
  if (p.matches('geplande'))
    c = 'Geplande actie'
  if (p.matches('afgevallen'))
    c = 'Afgevallen lading'
  if (p.matches('vervuild wegdek'))
    c = 'Vervuild wegdek'
  if (p.matches('proefalarm'))
    c = 'Proefalarm'
  if (p.matches('demonstratie'))
    c = 'Demonstratie'
  if (p.matches('korpsalarm'))
    c = 'Korpsalarm brandweer'
  if (p.matches('nacontrole'))
    c = 'Nacontrole'
  if (p.matches('nacontrole') && p.matches(['brand', 'br']))
    c = 'Nacontrole brand'
  if (p.matches(['ass', 'assistentie']))
    c = 'Assistentie'
  if (p.matches(['ass', 'assistentie']) && p.matches(['politie', 'pol']))
    c = 'Assistentie bij politie'
  if (p.matches(['ass', 'assistentie']) && p.matches('ambulance'))
    c = 'Assistentie bij ambulance'
  if (p.matches(['ass', 'assistentie']) && p.matches('wegverkeer'))
    c = 'Assistentie wegverkeer'
  if (p.matches(['ass', 'assistentie']) && p.matches('til'))
    c = 'Assistentie bij tillen'
  if (p.matches(['ass', 'assistentie']) && p.matches('ambu'))
    c = 'Medische assistentie'
  if (p.matches('afhijsen'))
    c = 'Assistentie afhijsen patient'
  if (p.matches(['aed', 'reanimatie'])) {
    if (obj.dienst == 'ambulance') {
      c = 'Hartstilstand (reanimatie)'
    } else {
      c = 'Assistentie bij reanimatie'
    }
  }
  if (p.matches('weeralarm'))
    c = 'Weeralarm'
  if (p.matches('weeralarm') && p.matches('hitte'))
  c = 'Weeralarm voor hitte'
  if ((p.contains('brand') || p.matches('br')))
    c = 'Brand melding'
  if ((p.contains('brand') || p.matches('br')))
    c = 'Brand melding'
  if ((p.contains('brand') || p.matches('br')) && p.matches(['auto', 'aut.']))
    c = 'Autobrand'
  if ((p.contains('brand') || p.matches('br')) && p.matches('buiten'))
    c = 'Buitenbrand'
  if ((p.contains('brand') || p.matches('br')) && p.contains(['afval', 'afvalrommel']))
    c = 'Buitenbrand (afval)'
  if ((p.contains('brand') || p.matches('br')) && p.matches('container'))
    c = 'Afvalcontainer brand'
  if (p.matches('containerbrand'))
    c = 'Afvalcontainer brand'
  if ((p.contains('brand') || p.matches('br')) && p.matches('voertuig'))
    c = 'Voertuigbrand'
  if ((p.contains('brand') || p.matches('br')) && p.matches('wegvervoer'))
    c = 'Voertuigbrand'
  if ((p.contains('brand') || p.matches('br')) && p.matches('voertuig') && p.matches('vrachtwagen'))
    c = 'Voertuigbrand vrachtwagen'
  if ((p.contains('brand') || p.matches('br')) && p.matches('voertuig') && p.matches('auto'))
    c = 'Voertuigbrand personenauto'
  if ((p.contains('brand') || p.matches('br')) && p.matches('voertuig') && p.matches('personenauto'))
    c = 'Voertuigbrand personenauto'
  if ((p.contains('brand') || p.matches('br')) && p.matches(['gerucht', 'brandgerucht']))
    c = 'Brandgerucht'
  if ((p.contains('brand') || p.matches('br')) && p.matches('gebouw'))
    c = 'Woningbrand'
  if ((p.contains('brand') || p.matches('br')) && p.matches('bijgebouw'))
    c = 'Brand bijgebouw'
  if ((p.contains('brand') || p.matches('br')) && p.matches('industrie'))
    c = 'Industriebrand'
  if ((p.contains('brand') || p.matches('br')) && p.matches(['scheepvaart', 'pleziervaart']))
    c = 'Scheepvaartbrand'
  if ((p.contains('brand') || p.matches('br')) && p.matches('woning'))
    c = 'Woningbrand'
  if ((p.contains('brand') || p.matches('br')) && p.matches('appartement'))
    c = 'Woningbrand (appartement)'
  if ((p.contains('brand') || p.matches('br')) && p.matches('keuken'))
    c = 'Woningbrand (keuken)'
  if ((p.contains('brand') || p.matches('br')) && p.matches('zolder'))
    c = 'Woningbrand (zolder)'
  if ((p.contains('brand') || p.matches('br')) && p.matches('dak'))
    c = 'Woningbrand (dak)'
  if ((p.contains('brand') || p.matches('br')) && p.matches('meterkast'))
    c = 'Woningbrand (meterkast)'
  if ((p.contains('brand') || p.matches('br')) && p.matches('schoorsteen'))
    c = 'Woningbrand (schoorsteen)'
  if ((p.contains('brand') || p.matches('br')) && p.matches(['schuur', 'hok', 'tuinhuis', 'keet']))
    c = 'Woningbrand (schuur/hok)'
  if ((p.contains('brand') || p.matches('br')) && p.matches(['bosschage', 'berm', 'ruigte']))
    c = 'Bermbrand (bosschage/struik)'
  if (p.matches(['oms', 'autom. brand', 'al ', 'pac']))
    c = 'Automatisch brandalarm'
  if (p.matches('sprinkler'))
    c = 'Sprinkleralarm'
  if (p.matches('rookdetectie'))
    c = 'Rookdetectie'
  if (p.matches(['co-melder', 'rookmelder']))
    c = 'Rookmelder'
  if (p.matches(['vko ', 'vko.']))
    c = 'Verkeersongeval'
  if (p.matches(['ongeval', 'ong']))
    c = 'Ongeval melding'
  if (p.matches(['ongeval', 'ong']) && p.matches('lek'))
    c = 'Vloeistof lek'
  if (p.matches(['ongeval', 'ong']) && p.matches('materieel'))
    c = 'Ongeval materieel'
  if (p.matches(['ongeval', 'ong']) && p.matches('gas'))
    c = 'Gas ongeval'
  if (p.matches(['ongeval', 'ong']) && p.matches('letsel'))
    c = 'Ongeval met letsel'
  if (p.matches(['ongeval', 'ong']) && p.matches('letsel') && p.matches('fabriek'))
    c = 'Fabrieksongeval met letsel'
  if (p.matches(['ongeval', 'ong']) && p.matches('wegvervoer'))
    c = 'Verkeersongeval'
  if (p.matches(['ongeval', 'ong']) && p.matches('wegvervoer') && p.matches('letsel'))
    c = 'Verkeersongeval met letsel'
  if (p.matches(['ongeval', 'ong']) && p.matches('wegvervoer') && p.matches('letsel'))
    c = 'Verkeersongeval met letsel'
  if (p.matches(['ongeval', 'ong']) && p.matches('wegvervoer') && p.matches('letsel') && p.matches('beknelling'))
    c = 'Verkeersongeval met letsel (bekneld)'
  if (p.matches(['ongeval', 'ong']) && p.matches('wegvervoer') && p.matches('letsel') && p.matches('aed'))
    c = 'Verkeersongeval met letsel (reanimatie)'
  if (p.matches(['ongeval', 'ong']) && p.matches('wegvervoer') && p.matches('materieel'))
    c = 'Verkeersongeval (materieel)'
  if (p.matches(['ongeval', 'ong']) && p.matches('spoor'))
    c = 'Ongeval op spoor'
  if (p.matches(['ongeval', 'ong']) && p.matches('spoor') && p.matches('letsel'))
    c = 'Ongeval op spoor met letsel'
  if (p.matches(['ongeval', 'ong']) && p.matches('spoor') && p.matches('materieel'))
    c = 'Ongeval op spoor (materieel)'
  if (p.matches('dier'))
    c = 'Dier in problemen'
  if (p.matches('dier') && p.matches('vee'))
    c = 'Dier in problemen (vee)'
  if (p.matches('dier') && p.matches('put'))
    c = 'Dier vast in put'
  if (p.matches('dier') && p.matches('loslopende'))
    c = 'Loslopende dieren'
  if (p.matches('dier') && p.matches('water'))
    c = 'Dier te water'
  if (p.matches('dier') && p.matches('wild'))
    c = 'Wild dier in problemen'
  if (p.matches('dier') && p.matches('loslopende') && p.matches('wild'))
    c = 'Loslopende wilde dieren'
  if (p.matches('dier') && p.matches('water') && p.matches('wild'))
    c = 'Wild dier te water'
  if (p.matches('dier') && p.matches('water') && p.matches('paard'))
    c = 'Paard te water'

  if (p.matches('woning') && obj.dienst == 'politie')
    c = '112 melding uit woning'
  if (!c) {
    console.log(obj)
    if (obj.dienst == 'politie') {
      c = 'Politie naar 112 melding'
    }
    if (obj.dienst == 'brandweer') {
      c = 'Brandweer naar 112 melding'
    }
    if (obj.dienst == 'ambulance') {
      c = 'Ambulance naar 112 melding'
    }
    if (obj.dienst == 'traumaheli') {
      c = 'Traumaheli persoon in levensgevaar'
    }
    if (obj.dienst == 'kustwacht') {
      c = 'Kustwacht naar Burgermelding'
    }
  }


  return c;
}

Main()
