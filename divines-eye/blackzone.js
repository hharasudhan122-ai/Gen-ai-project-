/**
     * BLACK ZONE - Tactical & Dark Intel Layers for Divine's Eye (Inline Core v4)
     * Features:
     *  - 70+ High-Threat & Homicide Hotspots (Critical Cartel, Gang & Conflict zones)
     *  - 85+ Global Nightlife, Bars, Pubs & Nightclub Belts
     *  - 65+ Tactical Firearm Outlets, Shooting Ranges & Armory Complexes
     *  - Immediate global visibility at any camera zoom (PointPrimitives with disableDepthTest)
     *  - Live Overpass micro-overlay when camera is zoomed close (< 12km)
     *  - Robust Cesium.Viewer detection via window.__godsEyeView, window.gevViewer, DOM polling
     */
    (function initBlackZone() {
      const THREAT_HOTSPOTS = [{"id":"us-stl","name":"St. Louis (North/East)","country":"USA","state":"MO","lat":38.627,"lon":-90.1994,"rate":68.2,"tier":"CRITICAL","desc":"Per-capita homicide hot zone - Baden and Wells-Goodfellow"},{"id":"us-bal","name":"Baltimore (West/East)","country":"USA","state":"MD","lat":39.2904,"lon":-76.6122,"rate":57.8,"tier":"CRITICAL","desc":"Historic armed syndicate and gang corridor - Sandtown/Berea"},{"id":"us-nola","name":"New Orleans (Central City/7th)","country":"USA","state":"LA","lat":29.9511,"lon":-90.0715,"rate":52.4,"tier":"CRITICAL","desc":"River delta violent crime and shooting clusters"},{"id":"us-det","name":"Detroit (East/West Belts)","country":"USA","state":"MI","lat":42.3314,"lon":-83.0458,"rate":41.4,"tier":"HIGH","desc":"Severe violent crime density and urban red zones"},{"id":"us-mem","name":"Memphis (Orange Mound/Frayser)","country":"USA","state":"TN","lat":35.1495,"lon":-90.049,"rate":45.3,"tier":"HIGH","desc":"Organized theft and interstate gun violence corridor"},{"id":"us-cle","name":"Cleveland (East Side/Kinsman)","country":"USA","state":"OH","lat":41.4993,"lon":-81.6944,"rate":38.2,"tier":"HIGH","desc":"Elevated shooting rates and post-industrial crime density"},{"id":"us-mke","name":"Milwaukee (North Side/53206)","country":"USA","state":"WI","lat":43.0389,"lon":-87.9065,"rate":37.6,"tier":"HIGH","desc":"Dense urban firearm friction corridor"},{"id":"us-chi","name":"Chicago (South and West Sides)","country":"USA","state":"IL","lat":41.782,"lon":-87.644,"rate":30.1,"tier":"HIGH","desc":"Englewood, Garfield Park and Austin gang territory sectors"},{"id":"us-phl","name":"Philadelphia (North/Kensington)","country":"USA","state":"PA","lat":39.9912,"lon":-75.1245,"rate":32.4,"tier":"HIGH","desc":"Open-air narcotics market and tactical emergency zone"},{"id":"us-bhm","name":"Birmingham (West End/Ensley)","country":"USA","state":"AL","lat":33.5186,"lon":-86.8104,"rate":51.2,"tier":"CRITICAL","desc":"Extreme homicide per-capita concentration"},{"id":"us-btr","name":"Baton Rouge (North Baton Rouge)","country":"USA","state":"LA","lat":30.4515,"lon":-91.1871,"rate":46.5,"tier":"HIGH","desc":"Interstate narcotics friction and armed syndicates"},{"id":"us-kc","name":"Kansas City (East Side)","country":"USA","state":"MO","lat":39.0997,"lon":-94.5786,"rate":34.8,"tier":"HIGH","desc":"Elevated homicide rate and illegal firearm markets"},{"id":"us-oak","name":"Oakland (East/Deep East)","country":"USA","state":"CA","lat":37.7652,"lon":-122.1804,"rate":28.9,"tier":"HIGH","desc":"Carjacking, cartel transit and retaliatory shootings"},{"id":"us-abq","name":"Albuquerque (International District)","country":"USA","state":"NM","lat":35.0844,"lon":-106.6504,"rate":26.7,"tier":"HIGH","desc":"War Zone sector - extreme vehicle theft and cartel fentanyl"},{"id":"us-gary","name":"Gary (Broadway Corridor)","country":"USA","state":"IN","lat":41.5934,"lon":-87.3464,"rate":44,"tier":"HIGH","desc":"Structural vacancy and chronic violent crime"},{"id":"us-stock","name":"Stockton (South Stockton)","country":"USA","state":"CA","lat":37.9577,"lon":-121.2908,"rate":24.5,"tier":"TACTICAL","desc":"Central Valley gang rivalry nexus"},{"id":"us-day","name":"Dayton (West Dayton)","country":"USA","state":"OH","lat":39.7589,"lon":-84.1916,"rate":30.5,"tier":"TACTICAL","desc":"Opioid supply chain flashpoint"},{"id":"mx-col","name":"Colima Metro Corridor","country":"Mexico","state":"Colima","lat":19.2452,"lon":-103.7247,"rate":181.9,"tier":"CRITICAL","desc":"World highest murder rate - CJNG vs Sinaloa port transit"},{"id":"mx-tij","name":"Tijuana Border Sector","country":"Mexico","state":"Baja California","lat":32.5149,"lon":-117.0382,"rate":138,"tier":"CRITICAL","desc":"San Ysidro border crossing contraband war"},{"id":"mx-jrz","name":"Ciudad Juarez Valley","country":"Mexico","state":"Chihuahua","lat":31.6904,"lon":-106.4245,"rate":104.5,"tier":"CRITICAL","desc":"Border fentanyl and migrant smuggling battleground"},{"id":"mx-cly","name":"Celaya Industrial Ring","country":"Mexico","state":"Guanajuato","lat":20.5218,"lon":-100.814,"rate":109.4,"tier":"CRITICAL","desc":"CSRL vs CJNG huachicol and extortion syndicate"},{"id":"mx-zam","name":"Zamora / Jacona","country":"Mexico","state":"Michoacan","lat":19.9868,"lon":-102.2834,"rate":177.7,"tier":"CRITICAL","desc":"Avocado corridor and methamphetamine labs"},{"id":"mx-aca","name":"Acapulco Urban Core","country":"Mexico","state":"Guerrero","lat":16.8531,"lon":-99.8237,"rate":110.5,"tier":"CRITICAL","desc":"Colonia Renacimiento and cartel tourist extortion"},{"id":"mx-uru","name":"Uruapan Forest Zone","country":"Mexico","state":"Michoacan","lat":19.4174,"lon":-102.0522,"rate":86.8,"tier":"HIGH","desc":"Tierra Caliente cartel skirmish corridor"},{"id":"mx-fre","name":"Fresnillo Mining Sector","country":"Mexico","state":"Zacatecas","lat":23.1758,"lon":-102.8706,"rate":140,"tier":"CRITICAL","desc":"Highway 45 cartel choke point and ambushes"},{"id":"mx-zac","name":"Zacatecas Metro","country":"Mexico","state":"Zacatecas","lat":22.7709,"lon":-102.5832,"rate":90,"tier":"HIGH","desc":"CJNG vs Sinaloa Cartel territorial friction"},{"id":"mx-cul","name":"Culiacan Cartel Capital","country":"Mexico","state":"Sinaloa","lat":24.8091,"lon":-107.3938,"rate":72.5,"tier":"HIGH","desc":"Los Chapitos vs Mayos armed faction war"},{"id":"mx-rey","name":"Reynosa Border River","country":"Mexico","state":"Tamaulipas","lat":26.0945,"lon":-98.2794,"rate":65,"tier":"HIGH","desc":"Gulf Cartel Metros vs Escorpiones pipeline war"},{"id":"mx-nl","name":"Nuevo Laredo (Los Zetas HQ)","country":"Mexico","state":"Tamaulipas","lat":27.4862,"lon":-99.5073,"rate":60,"tier":"HIGH","desc":"Cartel del Noreste Tropa del Infierno fortress"},{"id":"mx-ira","name":"Irapuato Refinery Zone","country":"Mexico","state":"Guanajuato","lat":20.6767,"lon":-101.3563,"rate":95,"tier":"CRITICAL","desc":"Mass shooting and bar attack corridor"},{"id":"mx-can","name":"Cancun Region 259","country":"Mexico","state":"Quintana Roo","lat":21.1619,"lon":-86.8515,"rate":55,"tier":"HIGH","desc":"Narcomenudeo and beachside turf disputes"},{"id":"ht-pap","name":"Port-au-Prince Metro","country":"Haiti","state":"Ouest","lat":18.5944,"lon":-72.3074,"rate":96.2,"tier":"CRITICAL","desc":"Viv Ansanm gang confederation full urban blockade"},{"id":"jm-kin","name":"Kingston (Downtown & West)","country":"Jamaica","state":"Surrey","lat":17.9714,"lon":-76.7936,"rate":64.1,"tier":"HIGH","desc":"Tivoli Gardens and Denham Town garrison wars"},{"id":"jm-mobay","name":"Montego Bay (Flankers)","country":"Jamaica","state":"Cornwall","lat":18.4714,"lon":-77.9188,"rate":58,"tier":"HIGH","desc":"Lottery scam warfare and armed turf battles"},{"id":"hn-sps","name":"San Pedro Sula (Chamelecon)","country":"Honduras","state":"Cortes","lat":15.5042,"lon":-88.025,"rate":78,"tier":"CRITICAL","desc":"MS-13 vs Barrio 18 extortion frontline"},{"id":"hn-teg","name":"Tegucigalpa (Carrizal/Pedregal)","country":"Honduras","state":"Francisco Morazan","lat":14.0723,"lon":-87.2062,"rate":61,"tier":"HIGH","desc":"Barrio 18 stronghold and armed transit taxes"},{"id":"gt-gtc","name":"Guatemala City (Zone 18)","country":"Guatemala","state":"Guatemala","lat":14.6547,"lon":-90.493,"rate":54,"tier":"HIGH","desc":"Extortion syndicates and bus transit assassinations"},{"id":"tt-pos","name":"Port of Spain (Laventille)","country":"Trinidad","state":"St. George","lat":10.6418,"lon":-61.5,"rate":46,"tier":"HIGH","desc":"Rasta City vs Muslims gang corridor"},{"id":"pa-col","name":"Colon Port Canal Gateway","country":"Panama","state":"Colon","lat":9.3598,"lon":-79.9013,"rate":42,"tier":"HIGH","desc":"Transatlantic container cocaine trafficking clash"},{"id":"ec-gyq","name":"Guayaquil (Nueva Prosperina)","country":"Ecuador","state":"Guayas","lat":-2.1894,"lon":-79.8891,"rate":88.8,"tier":"CRITICAL","desc":"Los Lobos / Tiguerones container terminal cartel war"},{"id":"ec-esm","name":"Esmeraldas Coastal Border","country":"Ecuador","state":"Esmeraldas","lat":0.9592,"lon":-79.6527,"rate":81,"tier":"CRITICAL","desc":"Colombian dissident FARC and cartel maritime launch"},{"id":"ec-dur","name":"Duran Industrial Suburb","country":"Ecuador","state":"Guayas","lat":-2.1706,"lon":-79.8256,"rate":145,"tier":"CRITICAL","desc":"Latin Kings vs Chone Killers turf execution zone"},{"id":"ve-ccs","name":"Caracas (Petare & Cota 905)","country":"Venezuela","state":"Distrito Capital","lat":10.4806,"lon":-66.9036,"rate":76.3,"tier":"HIGH","desc":"Mega-bandas and Tren de Aragua recruitment hub"},{"id":"ve-gua","name":"Ciudad Guayana Mining Hub","country":"Venezuela","state":"Bolivar","lat":8.3619,"lon":-62.6517,"rate":64,"tier":"HIGH","desc":"Sindicatos armados controlling illegal gold pits"},{"id":"ve-mar","name":"Maracaibo (San Francisco)","country":"Venezuela","state":"Zulia","lat":10.6544,"lon":-71.613,"rate":52,"tier":"HIGH","desc":"Lake Maracaibo fuel piracy and cartel hitmen"},{"id":"co-cali","name":"Cali (Siloe & Aguablanca)","country":"Colombia","state":"Valle del Cauca","lat":3.4516,"lon":-76.532,"rate":45.1,"tier":"HIGH","desc":"Pacific corridor narco-trafficking and micro-extortion"},{"id":"co-bue","name":"Buenaventura Port Sector","country":"Colombia","state":"Valle del Cauca","lat":3.8801,"lon":-77.0312,"rate":62,"tier":"CRITICAL","desc":"Shottas vs Espartanos port container dominance"},{"id":"co-med","name":"Medellin (Comuna 13/Castilla)","country":"Colombia","state":"Antioquia","lat":6.2442,"lon":-75.5812,"rate":24,"tier":"TACTICAL","desc":"Oficina de Envigado micro-trafficking networks"},{"id":"br-for","name":"Fortaleza (Jangurussu/Bom Jardim)","country":"Brazil","state":"Ceara","lat":-3.7319,"lon":-38.5267,"rate":48,"tier":"HIGH","desc":"GDE vs Comando Vermelho transatlantic shipping routes"},{"id":"br-sal","name":"Salvador (Valeria & Periperi)","country":"Brazil","state":"Bahia","lat":-12.9777,"lon":-38.5016,"rate":56,"tier":"CRITICAL","desc":"Bonde do Maluco vs CV drone and rifle battles"},{"id":"br-mac","name":"Maceio Coastal Belt","country":"Brazil","state":"Alagoas","lat":-9.6658,"lon":-35.735,"rate":51,"tier":"HIGH","desc":"Persistent per-capita homicide leadership zone"},{"id":"br-rec","name":"Recife (Ibura & Santo Amaro)","country":"Brazil","state":"Pernambuco","lat":-8.0476,"lon":-34.877,"rate":44,"tier":"HIGH","desc":"Drug point disputes and militia executions"},{"id":"br-man","name":"Manaus (Compensa)","country":"Brazil","state":"Amazonas","lat":-3.119,"lon":-60.0217,"rate":47,"tier":"HIGH","desc":"Solimoes river cocaine super-highway"},{"id":"br-rio","name":"Rio de Janeiro (Complexo da Mare)","country":"Brazil","state":"Rio de Janeiro","lat":-22.8624,"lon":-43.2476,"rate":38,"tier":"HIGH","desc":"Milicias vs CV / TCP military-grade weapon clashes"},{"id":"br-fsa","name":"Feira de Santana","country":"Brazil","state":"Bahia","lat":-12.2664,"lon":-38.9663,"rate":67,"tier":"CRITICAL","desc":"Bahia highway crossroads distribution battles"},{"id":"za-cpt","name":"Cape Flats (Hanover Park)","country":"South Africa","state":"Western Cape","lat":-33.993,"lon":18.538,"rate":68,"tier":"CRITICAL","desc":"Americans vs Hard Livings gang syndicate wars"},{"id":"za-jhb","name":"Johannesburg (Hillbrow/Berea)","country":"South Africa","state":"Gauteng","lat":-26.1884,"lon":28.0494,"rate":58,"tier":"HIGH","desc":"Armed hijackings, hostel turf wars and zama zamas"},{"id":"za-dur","name":"Durban (Umlazi & KwaMashu)","country":"South Africa","state":"KwaZulu-Natal","lat":-29.9678,"lon":30.8829,"rate":54,"tier":"HIGH","desc":"Taxi boss hitmen (izinkabi) and assassination capital"},{"id":"za-gqe","name":"Gqeberha (New Brighton)","country":"South Africa","state":"Eastern Cape","lat":-33.918,"lon":25.57,"rate":71,"tier":"CRITICAL","desc":"Northern areas gang territorial shooting waves"},{"id":"so-mog","name":"Mogadishu (Bakara/Hodan)","country":"Somalia","state":"Banaadir","lat":2.0469,"lon":45.3182,"rate":95,"tier":"CRITICAL","desc":"Al-Shabaab SVBIED strikes and targeted assassinations"},{"id":"cd-beni","name":"Beni & Oicha Sector","country":"DRC Congo","state":"North Kivu","lat":0.49,"lon":29.473,"rate":120,"tier":"CRITICAL","desc":"ADF Islamist machete massacres and ambushes"},{"id":"cd-goma","name":"Goma Frontier Zone","country":"DRC Congo","state":"North Kivu","lat":-1.6596,"lon":29.2217,"rate":85,"tier":"CRITICAL","desc":"M23 rebel siege, FDLR and Wazalendo militia chaos"},{"id":"sd-krt","name":"Khartoum Urban Battleground","country":"Sudan","state":"Khartoum","lat":15.5007,"lon":32.5599,"rate":130,"tier":"CRITICAL","desc":"RSF rapid intervention forces vs SAF urban war"},{"id":"sd-fas","name":"El Fasher Siege Zone","country":"Sudan","state":"North Darfur","lat":13.6288,"lon":25.3549,"rate":160,"tier":"CRITICAL","desc":"Janjaweed siege, artillery shelling and famine perimeter"},{"id":"ml-bam","name":"Bamako & Koulikoro Axis","country":"Mali","state":"Bamako","lat":12.6392,"lon":-8.0029,"rate":58,"tier":"HIGH","desc":"JNIM Al-Qaeda affiliate suicide attacks and checkpoints"},{"id":"bf-oua","name":"Ouagadougou & Djibo Axis","country":"Burkina Faso","state":"Centre","lat":12.3647,"lon":-1.5338,"rate":74,"tier":"CRITICAL","desc":"Jihadist massacres, IED corridors and military junta tension"},{"id":"ng-mai","name":"Maiduguri & Sambisa Fringe","country":"Nigeria","state":"Borno","lat":11.8333,"lon":13.15,"rate":80,"tier":"CRITICAL","desc":"ISWAP / Boko Haram suicide attacks and bush raids"},{"id":"ng-kad","name":"Kaduna-Birnin Gwari Forest","country":"Nigeria","state":"Kaduna","lat":10.5105,"lon":7.4165,"rate":65,"tier":"HIGH","desc":"Bandit kidnapping cartels and train attack routes"},{"id":"ly-tip","name":"Tripoli (Abu Salim/Mitiga)","country":"Libya","state":"Tripoli","lat":32.8872,"lon":13.1913,"rate":48,"tier":"HIGH","desc":"444 Brigade vs RADA armed battles"},{"id":"ye-san","name":"Sana'a Military Enclave","country":"Yemen","state":"Amanat Al Asimah","lat":15.3694,"lon":44.191,"rate":90,"tier":"CRITICAL","desc":"Ansar Allah (Houthi) ballistic command and strike target"},{"id":"ye-ade","name":"Aden Port & Crater Sector","country":"Yemen","state":"Aden","lat":12.7855,"lon":45.0187,"rate":68,"tier":"HIGH","desc":"STC southern separatist and car bomb assassination vector"},{"id":"sy-idb","name":"Idlib / Saraqib Front","country":"Syria","state":"Idlib","lat":35.9306,"lon":36.634,"rate":95,"tier":"CRITICAL","desc":"HTS rebel stronghold under constant artillery barrages"},{"id":"sy-deir","name":"Deir ez-Zor Euphrates Belt","country":"Syria","state":"Deir ez-Zor","lat":35.337,"lon":40.1408,"rate":85,"tier":"CRITICAL","desc":"SDF vs Iranian-backed militia river skirmishes"},{"id":"iq-bag","name":"Baghdad (Sadr City & Belts)","country":"Iraq","state":"Baghdad","lat":33.35,"lon":44.45,"rate":42,"tier":"HIGH","desc":"Popular Mobilization faction rivalries and rocket salvos"},{"id":"af-kab","name":"Kabul (PD13 Dasht-e-Barchi)","country":"Afghanistan","state":"Kabul","lat":34.5,"lon":69.1,"rate":75,"tier":"CRITICAL","desc":"ISKP Hazara minority bombings and Taliban raids"},{"id":"ps-jen","name":"Jenin Refugee Camp","country":"Palestine","state":"West Bank","lat":32.461,"lon":35.2954,"rate":85,"tier":"CRITICAL","desc":"Armed clash and drone strike zone"},{"id":"ps-gza","name":"Gaza Strip Combat Zone","country":"Palestine","state":"Gaza","lat":31.5,"lon":34.4667,"rate":250,"tier":"CRITICAL","desc":"Active war theater and high-density combat ruins"},{"id":"pk-pes","name":"Peshawar (Khyber Pass Link)","country":"Pakistan","state":"Khyber Pakhtunkhwa","lat":34.0151,"lon":71.5805,"rate":62,"tier":"HIGH","desc":"TTP police headquarters bombings and border insurgency"},{"id":"pk-khi","name":"Karachi (Lyari & Orangi)","country":"Pakistan","state":"Sindh","lat":24.8934,"lon":66.9972,"rate":38,"tier":"HIGH","desc":"Historic Lyari gang wars, ethnic mafias and target killers"},{"id":"mm-shn","name":"Lashio & Northern Shan State","country":"Myanmar","state":"Shan","lat":22.9333,"lon":97.75,"rate":115,"tier":"CRITICAL","desc":"Operation 1027 Three Brotherhood Alliance anti-junta offensive"},{"id":"ph-mar","name":"Marawi & Lanao del Sur","country":"Philippines","state":"BARMM","lat":8,"lon":124.2833,"rate":48,"tier":"HIGH","desc":"Dawlah Islamiyah and Maute remnant cell operations"},{"id":"pg-eng","name":"Enga Province Highland Valley","country":"Papua New Guinea","state":"Enga","lat":-5.5504,"lon":143.6,"rate":90,"tier":"CRITICAL","desc":"High-powered rifle tribal ambushes and massacres"},{"id":"pg-pom","name":"Port Moresby (Gordons)","country":"Papua New Guinea","state":"NCD","lat":-9.4438,"lon":147.1803,"rate":65,"tier":"HIGH","desc":"Raskol street gangs, machete hold-ups and civil unrest"},{"id":"ua-bak","name":"Bakhmut / Chasiv Yar Sector","country":"Ukraine","state":"Donetsk","lat":48.5954,"lon":37.9982,"rate":280,"tier":"CRITICAL","desc":"Full-scale mechanized war and drone kill-box"},{"id":"ua-khe","name":"Kherson Dnipro River Line","country":"Ukraine","state":"Kherson","lat":46.6354,"lon":32.6169,"rate":140,"tier":"CRITICAL","desc":"FPV drone hunting and artillery cross-river bombardment"},{"id":"ua-zpr","name":"Orikhiv / Robotyne Front","country":"Ukraine","state":"Zaporizhzhia","lat":47.567,"lon":35.783,"rate":190,"tier":"CRITICAL","desc":"Heavily mined anti-tank ditch and glide-bomb zone"},{"id":"fr-mrs","name":"Marseille (15e/16e Cites)","country":"France","state":"Bouches-du-Rhone","lat":43.36,"lon":5.36,"rate":18,"tier":"TACTICAL","desc":"DZ Mafia vs Yoda Kalashnikov narco-vendettas"},{"id":"it-nap","name":"Naples (Scampia / Secondigliano)","country":"Italy","state":"Campania","lat":40.895,"lon":14.246,"rate":14,"tier":"TACTICAL","desc":"Camorra clan piazza di spaccio drug super-centers"},{"id":"in-sgr","name":"Srinagar (Old City / Downtown)","country":"India","state":"Jammu and Kashmir","lat":34.0837,"lon":74.7973,"rate":42,"tier":"CRITICAL","desc":"Historic counter-terror cordon zone, stone-pelting and militant encounter corridors"},{"id":"in-pul","name":"Pulwama & Shopian Orchards","country":"India","state":"Jammu and Kashmir","lat":33.871,"lon":74.896,"rate":55,"tier":"CRITICAL","desc":"South Kashmir active militancy belt, IED risk and encounter hot zone"},{"id":"in-kup","name":"Kupwara & Keran Sector","country":"India","state":"Jammu and Kashmir","lat":34.526,"lon":74.254,"rate":60,"tier":"CRITICAL","desc":"Line of Control (LoC) active infiltration and sniper exchange frontier"},{"id":"in-uri","name":"Uri & Baramulla Gorge","country":"India","state":"Jammu and Kashmir","lat":34.084,"lon":74.038,"rate":52,"tier":"CRITICAL","desc":"LoC border artillery artillery shelling and infiltration route"},{"id":"in-pnc","name":"Poonch & Rajouri Border Belt","country":"India","state":"Jammu and Kashmir","lat":33.77,"lon":74.1,"rate":48,"tier":"CRITICAL","desc":"Pir Panjal cross-border skirmish corridor and ambush zone"},{"id":"in-suk","name":"Sukma / Chintalnar Red Zone","country":"India","state":"Chhattisgarh","lat":18.4,"lon":81.67,"rate":95,"tier":"CRITICAL","desc":"Dandakaranya deep forest Maoist PLGA ambush and pressure IED death-trap corridor"},{"id":"in-bij","name":"Bijapur / Tekalguda Jungle","country":"India","state":"Chhattisgarh","lat":18.79,"lon":80.81,"rate":90,"tier":"CRITICAL","desc":"Maoist 1st Battalion stronghold, high-casualty tactical ambush perimeter"},{"id":"in-dan","name":"Dantewada / Kuakonda","country":"India","state":"Chhattisgarh","lat":18.9,"lon":81.35,"rate":78,"tier":"CRITICAL","desc":"Iron ore railway sabotage and armed Naxalite guerrilla stronghold"},{"id":"in-gad","name":"Gadchiroli / Korchi Forests","country":"India","state":"Maharashtra","lat":20.18,"lon":80,"rate":70,"tier":"CRITICAL","desc":"Abujhmad border Maoist operational red zone and landmine corridors"},{"id":"in-lat","name":"Latehar & Palamu Forest Axis","country":"India","state":"Jharkhand","lat":23.74,"lon":84.5,"rate":62,"tier":"HIGH","desc":"TPC and CPI-Maoist extortion wars and coal convoy ambushes"},{"id":"in-mlk","name":"Malkangiri (Swabhiman Anchal)","country":"India","state":"Odisha","lat":18.35,"lon":81.9,"rate":65,"tier":"HIGH","desc":"Andhra-Odisha border water reservoir guerrilla haven and Maoist redoubt"},{"id":"in-imp","name":"Imphal Valley & Kangpokpi Buffer","country":"India","state":"Manipur","lat":24.817,"lon":93.9368,"rate":85,"tier":"CRITICAL","desc":"Kuki-Meitei ethnic conflict frontline, drone-dropped explosives and sniper bunkers"},{"id":"in-ccp","name":"Churachandpur Foothills","country":"India","state":"Manipur","lat":24.3333,"lon":93.6833,"rate":82,"tier":"CRITICAL","desc":"Village defense armed militia perimeter and high-intensity gunfire corridor"},{"id":"in-mor","name":"Moreh Border Smuggling Gateway","country":"India","state":"Manipur","lat":24.25,"lon":94.3,"rate":75,"tier":"CRITICAL","desc":"Indo-Myanmar contraband, illicit arms pipeline and cross-border insurgent clashes"},{"id":"in-mon","name":"Mon & Tuensang Frontier","country":"India","state":"Nagaland","lat":26.75,"lon":95.1,"rate":45,"tier":"HIGH","desc":"NSCN-K faction armed movements and cross-border jungle tracks"},{"id":"in-chm","name":"Chambal Ravines (Bhind & Morena)","country":"India","state":"Madhya Pradesh","lat":26.56,"lon":78,"rate":58,"tier":"HIGH","desc":"Historic dacoit ravines, illegal gun possession and family clan blood feuds"},{"id":"in-mrt","name":"Meerut (Sotiganj / Lisari Gate)","country":"India","state":"Uttar Pradesh","lat":28.9845,"lon":77.7064,"rate":44,"tier":"HIGH","desc":"Organized stolen auto chop-shops and illicit country pistol (Katta) manufacture"},{"id":"in-muz","name":"Muzaffarnagar & Shamli Rural","country":"India","state":"Uttar Pradesh","lat":29.4727,"lon":77.7085,"rate":40,"tier":"HIGH","desc":"Western UP gangster turf wars, contract killings and agrarian syndicate shootouts"},{"id":"in-dhn","name":"Dhanbad & Jharia (Wasseypur)","country":"India","state":"Jharkhand","lat":23.7957,"lon":86.4304,"rate":52,"tier":"CRITICAL","desc":"Wasseypur coal mafia gang wars, railway extortion and contract hitmen"},{"id":"in-dli","name":"North-East Delhi (Seelampur/Jafrabad)","country":"India","state":"Delhi","lat":28.67,"lon":77.27,"rate":36,"tier":"HIGH","desc":"Dense gang warfare, illegal firearm transit and riot-sensitive hot zone"},{"id":"in-mwt","name":"Mewat / Nuh & Bharatpur","country":"India","state":"Haryana","lat":28.1,"lon":77,"rate":38,"tier":"HIGH","desc":"Interstate armed vehicle-jacking, cyber-extortion cartels and border clashes"},{"id":"in-asn","name":"Asansol-Raniganj Coalfield Belt","country":"India","state":"West Bengal","lat":23.6889,"lon":86.9661,"rate":34,"tier":"TACTICAL","desc":"Illegal coal extraction pits, syndicated armed clashes and union violence"},{"id":"in-tuty","name":"Thoothukudi & Tirunelveli Axis","country":"India","state":"Tamil Nadu","lat":8.7139,"lon":77.7567,"rate":32,"tier":"TACTICAL","desc":"South Tamil Nadu retaliatory sickle vendettas and historic caste clashes"},{"id":"in-chn","name":"North Chennai (Vyasarpadi & Kasimedu)","country":"India","state":"Tamil Nadu","lat":13.12,"lon":80.26,"rate":28,"tier":"TACTICAL","desc":"Historic harbor smuggling, rowdy gang vendettas and retaliatory killings"},{"id":"in-knr","name":"Kannur Political Killing Belt","country":"India","state":"Kerala","lat":11.8745,"lon":75.3704,"rate":26,"tier":"TACTICAL","desc":"Decades of retaliatory political party cadre murders and country-made crude bombs"}];
      const SEED_BARS = [{"name":"Las Vegas Strip","city":"Las Vegas","state":"NV","country":"USA","lat":36.1147,"lon":-115.1728,"type":"nightclub"},{"name":"Fremont Street Experience","city":"Las Vegas","state":"NV","country":"USA","lat":36.1699,"lon":-115.1438,"type":"bar"},{"name":"Bourbon Street","city":"New Orleans","state":"LA","country":"USA","lat":29.9584,"lon":-90.0644,"type":"bar"},{"name":"Frenchmen Street Jazz Clubs","city":"New Orleans","state":"LA","country":"USA","lat":29.9634,"lon":-90.0577,"type":"bar"},{"name":"Miami South Beach (Ocean Dr)","city":"Miami Beach","state":"FL","country":"USA","lat":25.7795,"lon":-80.13,"type":"nightclub"},{"name":"Wynwood Art District Bars","city":"Miami","state":"FL","country":"USA","lat":25.801,"lon":-80.199,"type":"bar"},{"name":"Hollywood Sunset Strip","city":"Los Angeles","state":"CA","country":"USA","lat":34.09,"lon":-118.383,"type":"nightclub"},{"name":"Santa Monica 3rd St Promenade","city":"Santa Monica","state":"CA","country":"USA","lat":34.015,"lon":-118.496,"type":"bar"},{"name":"NYC Meatpacking District","city":"New York","state":"NY","country":"USA","lat":40.7407,"lon":-74.0047,"type":"nightclub"},{"name":"NYC East Village Bar Row","city":"New York","state":"NY","country":"USA","lat":40.7265,"lon":-73.9847,"type":"bar"},{"name":"NYC Williamsburg Cocktail Belt","city":"New York","state":"NY","country":"USA","lat":40.716,"lon":-73.959,"type":"bar"},{"name":"Chicago River North Clubs","city":"Chicago","state":"IL","country":"USA","lat":41.8919,"lon":-87.6318,"type":"nightclub"},{"name":"Chicago Wicker Park Pubs","city":"Chicago","state":"IL","country":"USA","lat":41.9088,"lon":-87.6775,"type":"bar"},{"name":"Austin 6th Street Entertainment","city":"Austin","state":"TX","country":"USA","lat":30.2682,"lon":-97.7404,"type":"bar"},{"name":"Austin Rainey Street Historic","city":"Austin","state":"TX","country":"USA","lat":30.2589,"lon":-97.7385,"type":"bar"},{"name":"Nashville Lower Broadway","city":"Nashville","state":"TN","country":"USA","lat":36.1587,"lon":-86.7785,"type":"bar"},{"name":"San Francisco North Beach","city":"San Francisco","state":"CA","country":"USA","lat":37.7989,"lon":-122.4075,"type":"bar"},{"name":"San Francisco Castro District","city":"San Francisco","state":"CA","country":"USA","lat":37.762,"lon":-122.435,"type":"nightclub"},{"name":"Portland Pearl District Breweries","city":"Portland","state":"OR","country":"USA","lat":45.5267,"lon":-122.6822,"type":"bar"},{"name":"Seattle Capitol Hill Nightlife","city":"Seattle","state":"WA","country":"USA","lat":47.6148,"lon":-122.3168,"type":"nightclub"},{"name":"Denver LoDo Historic Bars","city":"Denver","state":"CO","country":"USA","lat":39.753,"lon":-104.998,"type":"bar"},{"name":"Scottsdale Old Town Nightclubs","city":"Scottsdale","state":"AZ","country":"USA","lat":33.4942,"lon":-111.9261,"type":"nightclub"},{"name":"Atlanta Buckhead Village","city":"Atlanta","state":"GA","country":"USA","lat":33.84,"lon":-84.38,"type":"nightclub"},{"name":"Boston Faneuil Hall Pubs","city":"Boston","state":"MA","country":"USA","lat":42.3601,"lon":-71.0547,"type":"bar"},{"name":"Honolulu Waikiki Beach Bars","city":"Honolulu","state":"HI","country":"USA","lat":21.2766,"lon":-157.8275,"type":"bar"},{"name":"Toronto King West Entertainment","city":"Toronto","state":"ON","country":"Canada","lat":43.6448,"lon":-79.394,"type":"nightclub"},{"name":"Montreal Crescent & Saint-Laurent","city":"Montreal","state":"QC","country":"Canada","lat":45.498,"lon":-73.577,"type":"nightclub"},{"name":"Vancouver Granville Strip","city":"Vancouver","state":"BC","country":"Canada","lat":49.281,"lon":-123.121,"type":"nightclub"},{"name":"Mexico City Zona Rosa & Roma Norte","city":"Mexico City","state":"CDMX","country":"Mexico","lat":19.42,"lon":-99.16,"type":"bar"},{"name":"Mexico City Polanco Masaryk Bars","city":"Mexico City","state":"CDMX","country":"Mexico","lat":19.4326,"lon":-99.196,"type":"nightclub"},{"name":"Cancun Punta Cancun Party Zone","city":"Cancun","state":"Quintana Roo","country":"Mexico","lat":21.137,"lon":-86.747,"type":"nightclub"},{"name":"Playa del Carmen 12th Avenue","city":"Playa del Carmen","state":"Quintana Roo","country":"Mexico","lat":20.628,"lon":-87.072,"type":"nightclub"},{"name":"Medellin Parque Lleras / Provenza","city":"Medellin","state":"Antioquia","country":"Colombia","lat":6.2085,"lon":-75.5678,"type":"nightclub"},{"name":"Bogota Zona T / Zona Rosa","city":"Bogota","state":"Cundinamarca","country":"Colombia","lat":4.668,"lon":-74.0536,"type":"nightclub"},{"name":"Cartagena Getsemani Plaza Bars","city":"Cartagena","state":"Bolivar","country":"Colombia","lat":10.4215,"lon":-75.5502,"type":"bar"},{"name":"Rio de Janeiro Lapa Arches Samba","city":"Rio de Janeiro","state":"RJ","country":"Brazil","lat":-22.913,"lon":-43.18,"type":"nightclub"},{"name":"Rio de Janeiro Ipanema Beach Bars","city":"Rio de Janeiro","state":"RJ","country":"Brazil","lat":-22.986,"lon":-43.204,"type":"bar"},{"name":"Sao Paulo Vila Madalena Botecos","city":"Sao Paulo","state":"SP","country":"Brazil","lat":-23.5575,"lon":-46.6957,"type":"bar"},{"name":"Sao Paulo Itaim Bibi Clubs","city":"Sao Paulo","state":"SP","country":"Brazil","lat":-23.583,"lon":-46.68,"type":"nightclub"},{"name":"Buenos Aires Palermo Soho","city":"Buenos Aires","state":"CABA","country":"Argentina","lat":-34.5875,"lon":-58.4313,"type":"bar"},{"name":"Buenos Aires Costanera Norte Clubs","city":"Buenos Aires","state":"CABA","country":"Argentina","lat":-34.555,"lon":-58.42,"type":"nightclub"},{"name":"Santiago Barrio Bellavista","city":"Santiago","state":"RM","country":"Chile","lat":-33.433,"lon":-70.638,"type":"bar"},{"name":"Lima Barranco Boulevard","city":"Lima","state":"Lima","country":"Peru","lat":-12.148,"lon":-77.021,"type":"bar"},{"name":"London Soho & West End","city":"London","state":"England","country":"UK","lat":51.5137,"lon":-0.1314,"type":"bar"},{"name":"London Shoreditch & Hoxton","city":"London","state":"England","country":"UK","lat":51.526,"lon":-0.078,"type":"nightclub"},{"name":"Dublin Temple Bar Quarter","city":"Dublin","state":"Leinster","country":"Ireland","lat":53.3454,"lon":-6.2642,"type":"bar"},{"name":"Edinburgh Cowgate & Grassmarket","city":"Edinburgh","state":"Scotland","country":"UK","lat":55.9486,"lon":-3.193,"type":"bar"},{"name":"Paris Bastille & Rue de Lappe","city":"Paris","state":"Ile-de-France","country":"France","lat":48.853,"lon":2.371,"type":"bar"},{"name":"Paris Pigalle & Moulin Rouge","city":"Paris","state":"Ile-de-France","country":"France","lat":48.8825,"lon":2.3322,"type":"nightclub"},{"name":"Amsterdam Leidseplein Squares","city":"Amsterdam","state":"North Holland","country":"Netherlands","lat":52.364,"lon":4.8827,"type":"nightclub"},{"name":"Amsterdam De Wallen Red Light Bars","city":"Amsterdam","state":"North Holland","country":"Netherlands","lat":52.373,"lon":4.898,"type":"bar"},{"name":"Berlin Kreuzberg Oranienstrasse","city":"Berlin","state":"Berlin","country":"Germany","lat":52.501,"lon":13.418,"type":"bar"},{"name":"Berlin Friedrichshain Warschauer Str","city":"Berlin","state":"Berlin","country":"Germany","lat":52.506,"lon":13.45,"type":"nightclub"},{"name":"Hamburg Reeperbahn St Pauli","city":"Hamburg","state":"Hamburg","country":"Germany","lat":53.5497,"lon":9.9612,"type":"nightclub"},{"name":"Munich Schwabing & Leopoldstrasse","city":"Munich","state":"Bavaria","country":"Germany","lat":48.16,"lon":11.586,"type":"bar"},{"name":"Madrid Malasana & Chueca","city":"Madrid","state":"Madrid","country":"Spain","lat":40.426,"lon":-3.702,"type":"bar"},{"name":"Barcelona Gothic Quarter & El Born","city":"Barcelona","state":"Catalonia","country":"Spain","lat":41.3852,"lon":2.1853,"type":"bar"},{"name":"Ibiza Playa den Bossa Superclubs","city":"Ibiza","state":"Balearic Islands","country":"Spain","lat":38.885,"lon":1.405,"type":"nightclub"},{"name":"Prague Old Town Dlouha Street","city":"Prague","state":"Prague","country":"Czech Republic","lat":50.09,"lon":14.425,"type":"bar"},{"name":"Budapest Jewish Quarter Ruin Pubs","city":"Budapest","state":"Budapest","country":"Hungary","lat":47.4979,"lon":19.0649,"type":"bar"},{"name":"Krakow Kazimierz Jewish Square","city":"Krakow","state":"Lesser Poland","country":"Poland","lat":50.0519,"lon":19.948,"type":"bar"},{"name":"Vienna Bermuda Triangle","city":"Vienna","state":"Vienna","country":"Austria","lat":48.2115,"lon":16.374,"type":"bar"},{"name":"Belgrade Savamala & Splavovi","city":"Belgrade","state":"Belgrade","country":"Serbia","lat":44.815,"lon":20.45,"type":"nightclub"},{"name":"Athens Gazi & Psyrri Squares","city":"Athens","state":"Attica","country":"Greece","lat":37.978,"lon":23.714,"type":"bar"},{"name":"Mykonos Chora Waterfront Bars","city":"Mykonos","state":"South Aegean","country":"Greece","lat":37.4467,"lon":25.3289,"type":"nightclub"},{"name":"Rome Trastevere Piazza Santa Maria","city":"Rome","state":"Lazio","country":"Italy","lat":41.889,"lon":12.47,"type":"bar"},{"name":"Tokyo Shibuya Crossing Clubs","city":"Tokyo","state":"Tokyo","country":"Japan","lat":35.6595,"lon":139.7005,"type":"nightclub"},{"name":"Tokyo Shinjuku Golden Gai","city":"Tokyo","state":"Tokyo","country":"Japan","lat":35.694,"lon":139.7047,"type":"bar"},{"name":"Tokyo Roppongi Night Strip","city":"Tokyo","state":"Tokyo","country":"Japan","lat":35.6628,"lon":139.7314,"type":"nightclub"},{"name":"Osaka Dotonbori Canal Bars","city":"Osaka","state":"Osaka","country":"Japan","lat":34.6687,"lon":135.5013,"type":"bar"},{"name":"Seoul Itaewon World Food St","city":"Seoul","state":"Seoul","country":"South Korea","lat":37.5345,"lon":126.994,"type":"nightclub"},{"name":"Seoul Hongdae Youth Club Strip","city":"Seoul","state":"Seoul","country":"South Korea","lat":37.556,"lon":126.923,"type":"nightclub"},{"name":"Seoul Gangnam Luxury Lounges","city":"Seoul","state":"Seoul","country":"South Korea","lat":37.4979,"lon":127.0276,"type":"nightclub"},{"name":"Bangkok Khao San Road","city":"Bangkok","state":"Bangkok","country":"Thailand","lat":13.7588,"lon":100.4974,"type":"bar"},{"name":"Bangkok Sukhumvit Soi 11","city":"Bangkok","state":"Bangkok","country":"Thailand","lat":13.743,"lon":100.556,"type":"nightclub"},{"name":"Bangkok Patpong Entertainment","city":"Bangkok","state":"Bangkok","country":"Thailand","lat":13.729,"lon":100.5315,"type":"nightclub"},{"name":"Phuket Patong Bangla Road","city":"Phuket","state":"Phuket","country":"Thailand","lat":7.8935,"lon":98.297,"type":"nightclub"},{"name":"Pattaya Walking Street","city":"Pattaya","state":"Chonburi","country":"Thailand","lat":12.925,"lon":100.871,"type":"nightclub"},{"name":"Singapore Clarke Quay Riverside","city":"Singapore","state":"Central","country":"Singapore","lat":1.2905,"lon":103.8461,"type":"nightclub"},{"name":"Hong Kong Lan Kwai Fong","city":"Hong Kong","state":"Central","country":"Hong Kong","lat":22.281,"lon":114.1554,"type":"bar"},{"name":"Hong Kong Wan Chai Lockhart Rd","city":"Hong Kong","state":"Wan Chai","country":"Hong Kong","lat":22.278,"lon":114.172,"type":"bar"},{"name":"Shanghai The Bund Roof Lounges","city":"Shanghai","state":"Shanghai","country":"China","lat":31.2397,"lon":121.49,"type":"nightclub"},{"name":"Shanghai French Concession Bars","city":"Shanghai","state":"Shanghai","country":"China","lat":31.215,"lon":121.455,"type":"bar"},{"name":"Taipei Ximending Pedestrian Area","city":"Taipei","state":"Taipei","country":"Taiwan","lat":25.042,"lon":121.508,"type":"bar"},{"name":"Manila Poblacion Makati Pubs","city":"Makati","state":"Metro Manila","country":"Philippines","lat":14.565,"lon":121.033,"type":"bar"},{"name":"Manila BGC The Fort Nightlife","city":"Taguig","state":"Metro Manila","country":"Philippines","lat":14.551,"lon":121.049,"type":"nightclub"},{"name":"Bali Seminyak Oberoi Sunset","city":"Seminyak","state":"Bali","country":"Indonesia","lat":-8.687,"lon":115.155,"type":"nightclub"},{"name":"Bali Kuta Legian Club Strip","city":"Kuta","state":"Bali","country":"Indonesia","lat":-8.718,"lon":115.172,"type":"nightclub"},{"name":"Goa Anjuna & Vagator Cliff Bars","city":"Goa","state":"Goa","country":"India","lat":15.58,"lon":73.743,"type":"nightclub"},{"name":"Goa Baga Beach Tito Lane","city":"Goa","state":"Goa","country":"India","lat":15.5566,"lon":73.751,"type":"nightclub"},{"name":"Mumbai Bandra Linking Rd Pubs","city":"Mumbai","state":"Maharashtra","country":"India","lat":19.06,"lon":72.833,"type":"bar"},{"name":"Bangalore Indiranagar 100ft Pubs","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.971,"lon":77.641,"type":"bar"},{"name":"Sydney Kings Cross & Darlinghurst","city":"Sydney","state":"NSW","country":"Australia","lat":-33.875,"lon":151.222,"type":"nightclub"},{"name":"Melbourne CBD Laneway Bars","city":"Melbourne","state":"VIC","country":"Australia","lat":-37.814,"lon":144.965,"type":"bar"},{"name":"Melbourne Fitzroy Brunswick St","city":"Melbourne","state":"VIC","country":"Australia","lat":-37.797,"lon":144.978,"type":"bar"},{"name":"Auckland Viaduct Harbour Bars","city":"Auckland","state":"Auckland","country":"New Zealand","lat":-36.845,"lon":174.761,"type":"bar"},{"name":"Cape Town Long Street Victorian Pubs","city":"Cape Town","state":"Western Cape","country":"South Africa","lat":-33.923,"lon":18.418,"type":"bar"},{"name":"Johannesburg Rosebank & Sandton","city":"Johannesburg","state":"Gauteng","country":"South Africa","lat":-26.146,"lon":28.043,"type":"nightclub"},{"name":"Nairobi Westlands Mpaka Road","city":"Nairobi","state":"Nairobi","country":"Kenya","lat":-1.263,"lon":36.804,"type":"bar"},{"name":"Lagos Victoria Island Mega-Clubs","city":"Lagos","state":"Lagos","country":"Nigeria","lat":6.429,"lon":3.431,"type":"nightclub"},{"name":"Dubai Marina & JBR Promenade","city":"Dubai","state":"Dubai","country":"UAE","lat":25.078,"lon":55.138,"type":"nightclub"},{"name":"Beirut Mar Mikhael Pub Strip","city":"Beirut","state":"Beirut","country":"Lebanon","lat":33.898,"lon":35.525,"type":"bar"},{"name":"Tel Aviv Rothschild Boulevard","city":"Tel Aviv","state":"Tel Aviv","country":"Israel","lat":32.064,"lon":34.774,"type":"bar"},{"name":"10 Downing Street (T. Nagar)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.0418,"lon":80.2341,"type":"pub"},{"name":"Pasha & The Leather Bar (The Park)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.0538,"lon":80.251,"type":"nightclub"},{"name":"Radio Room (San Thome)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.0335,"lon":80.278,"type":"bar"},{"name":"Bay 146 Pub (Mylapore)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.038,"lon":80.263,"type":"pub"},{"name":"Secret Society (RA Puram)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.025,"lon":80.258,"type":"bar"},{"name":"Gatsby 2000 (Crowne Plaza)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.029,"lon":80.249,"type":"nightclub"},{"name":"Moon and Sixpence (Guindy)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.01,"lon":80.215,"type":"pub"},{"name":"Anna Nagar 2nd Avenue Pub Hub","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.085,"lon":80.212,"type":"bar"},{"name":"ECR Surf & Beach Shacks (Kovalam)","city":"Chennai","state":"Tamil Nadu","country":"India","lat":12.792,"lon":80.251,"type":"bar"},{"name":"Velachery Phoenix Mall Restobars","city":"Chennai","state":"Tamil Nadu","country":"India","lat":12.992,"lon":80.217,"type":"bar"},{"name":"Bike & Barrel (Residency Coimbatore)","city":"Coimbatore","state":"Tamil Nadu","country":"India","lat":11.012,"lon":76.967,"type":"pub"},{"name":"French Quarter Promenade Bars","city":"Puducherry","state":"Puducherry","country":"India","lat":11.934,"lon":79.835,"type":"bar"},{"name":"Asian House Nightclub (White Town)","city":"Puducherry","state":"Puducherry","country":"India","lat":11.931,"lon":79.832,"type":"nightclub"},{"name":"Catamaran Brewing Co (Pondy ECR)","city":"Puducherry","state":"Puducherry","country":"India","lat":11.98,"lon":79.845,"type":"pub"},{"name":"Bell Jumbo Bar & Lounge","city":"Madurai","state":"Tamil Nadu","country":"India","lat":9.925,"lon":78.119,"type":"bar"},{"name":"Toit Brewpub (Indiranagar 100ft)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.9791,"lon":77.6406,"type":"pub"},{"name":"Arbor Brewing Company (Brigade Rd)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.9733,"lon":77.6075,"type":"pub"},{"name":"Windmills Craftworks (Whitefield)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.983,"lon":77.731,"type":"pub"},{"name":"Byg Brewski Brewing Co (Hennur)","city":"Bengaluru","state":"Karnataka","country":"India","lat":13.056,"lon":77.652,"type":"pub"},{"name":"Byg Brewski Brewing Co (Sarjapur)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.912,"lon":77.685,"type":"pub"},{"name":"Prost Brewpub (Koramangala 80ft)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.934,"lon":77.625,"type":"pub"},{"name":"Monkey Bar (Museum Road)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.971,"lon":77.605,"type":"bar"},{"name":"High Ultra Lounge (World Trade Center)","city":"Bengaluru","state":"Karnataka","country":"India","lat":13.013,"lon":77.555,"type":"nightclub"},{"name":"Pecos Classic Rock Pub (Rest House Rd)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.974,"lon":77.608,"type":"pub"},{"name":"Church Street & Brigade Pub Row","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.975,"lon":77.604,"type":"bar"},{"name":"Watsons Pub (Ulsoor Lake)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.981,"lon":77.619,"type":"pub"},{"name":"Pelican Pub & Restaurant","city":"Mysuru","state":"Karnataka","country":"India","lat":12.312,"lon":76.649,"type":"pub"},{"name":"Froth On Top Microbrewery","city":"Mangaluru","state":"Karnataka","country":"India","lat":12.87,"lon":74.843,"type":"pub"},{"name":"Totos Garage Pub (Bandra)","city":"Mumbai","state":"Maharashtra","country":"India","lat":19.058,"lon":72.83,"type":"pub"},{"name":"The Bombay Canteen (Lower Parel)","city":"Mumbai","state":"Maharashtra","country":"India","lat":19.006,"lon":72.831,"type":"bar"},{"name":"Leopold Cafe & Bar (Colaba)","city":"Mumbai","state":"Maharashtra","country":"India","lat":18.923,"lon":72.832,"type":"bar"},{"name":"Gokul Bar & Restaurant (Colaba)","city":"Mumbai","state":"Maharashtra","country":"India","lat":18.922,"lon":72.833,"type":"bar"},{"name":"Dome Rooftop (Marine Drive Intercon)","city":"Mumbai","state":"Maharashtra","country":"India","lat":18.932,"lon":72.823,"type":"nightclub"},{"name":"Doolally Taproom (Bandra Khar)","city":"Mumbai","state":"Maharashtra","country":"India","lat":19.068,"lon":72.835,"type":"pub"},{"name":"Gadda Da Vida (Juhu Novotel)","city":"Mumbai","state":"Maharashtra","country":"India","lat":19.108,"lon":72.824,"type":"nightclub"},{"name":"The Irish House (BKC)","city":"Mumbai","state":"Maharashtra","country":"India","lat":19.066,"lon":72.868,"type":"pub"},{"name":"High Spirits Cafe (Koregaon Park)","city":"Pune","state":"Maharashtra","country":"India","lat":18.536,"lon":73.899,"type":"nightclub"},{"name":"Effingut Brewerkz (Koregaon Park)","city":"Pune","state":"Maharashtra","country":"India","lat":18.538,"lon":73.901,"type":"pub"},{"name":"Balewadi High Street Bar Corridor","city":"Pune","state":"Maharashtra","country":"India","lat":18.575,"lon":73.771,"type":"bar"},{"name":"Titos Lane & Cafe Mambo (Baga)","city":"Baga","state":"Goa","country":"India","lat":15.5566,"lon":73.751,"type":"nightclub"},{"name":"Curlies & Shiva Valley (Anjuna Beach)","city":"Anjuna","state":"Goa","country":"India","lat":15.574,"lon":73.741,"type":"nightclub"},{"name":"HillTop Trance Arena (Vagator)","city":"Vagator","state":"Goa","country":"India","lat":15.594,"lon":73.743,"type":"nightclub"},{"name":"Thalassa Greek Taverna & Sunset (Siolim)","city":"Siolim","state":"Goa","country":"India","lat":15.626,"lon":73.749,"type":"bar"},{"name":"Antares Beach Club (Vagator Cliff)","city":"Vagator","state":"Goa","country":"India","lat":15.599,"lon":73.737,"type":"nightclub"},{"name":"Cohiba Bar & Kitchen (Sinquerim)","city":"Sinquerim","state":"Goa","country":"India","lat":15.503,"lon":73.768,"type":"pub"},{"name":"Joseph Bar (Fontainhas Heritage Panaji)","city":"Panaji","state":"Goa","country":"India","lat":15.498,"lon":73.832,"type":"bar"},{"name":"LPK Waterfront (Nerul River)","city":"Nerul","state":"Goa","country":"India","lat":15.508,"lon":73.793,"type":"nightclub"},{"name":"Leopard Valley Rave Arena (Agonda/Palolem)","city":"Canacona","state":"Goa","country":"India","lat":15.035,"lon":74.02,"type":"nightclub"},{"name":"Hauz Khas Village Lakeside Pubs","city":"New Delhi","state":"Delhi","country":"India","lat":28.5535,"lon":77.1945,"type":"nightclub"},{"name":"Connaught Place Outer Circle Pubs","city":"New Delhi","state":"Delhi","country":"India","lat":28.6328,"lon":77.2197,"type":"bar"},{"name":"My Bar Headquarters (Connaught Place)","city":"New Delhi","state":"Delhi","country":"India","lat":28.631,"lon":77.218,"type":"bar"},{"name":"Cyber Hub Brewery Boulevard (Gurgaon)","city":"Gurugram","state":"Haryana","country":"India","lat":28.495,"lon":77.089,"type":"pub"},{"name":"Sector 29 Microbrewery Strip (Gurgaon)","city":"Gurugram","state":"Haryana","country":"India","lat":28.468,"lon":77.062,"type":"pub"},{"name":"Noida Sector 18 & Gardens Galleria","city":"Noida","state":"Uttar Pradesh","country":"India","lat":28.57,"lon":77.325,"type":"nightclub"},{"name":"Sector 26 Brewery Strip (Chandigarh)","city":"Chandigarh","state":"Chandigarh","country":"India","lat":30.725,"lon":76.804,"type":"pub"},{"name":"Ranjit Avenue Bar Row (Amritsar)","city":"Amritsar","state":"Punjab","country":"India","lat":31.65,"lon":74.86,"type":"bar"},{"name":"Jubilee Hills Road 36 Pub Hub","city":"Hyderabad","state":"Telangana","country":"India","lat":17.432,"lon":78.407,"type":"pub"},{"name":"Banjara Hills Road 12 Lounges","city":"Hyderabad","state":"Telangana","country":"India","lat":17.416,"lon":78.438,"type":"bar"},{"name":"Gachibowli Hitec City Brewparks","city":"Hyderabad","state":"Telangana","country":"India","lat":17.44,"lon":78.375,"type":"pub"},{"name":"Ironhill Brewery (Siripuram)","city":"Visakhapatnam","state":"Andhra Pradesh","country":"India","lat":17.72,"lon":83.315,"type":"pub"},{"name":"Olypub & Someplace Else (Park St)","city":"Kolkata","state":"West Bengal","country":"India","lat":22.551,"lon":88.353,"type":"pub"},{"name":"Peter Cat & Trincas (Park Street)","city":"Kolkata","state":"West Bengal","country":"India","lat":22.553,"lon":88.354,"type":"bar"},{"name":"Sector V Salt Lake Tech Brewpubs","city":"Kolkata","state":"West Bengal","country":"India","lat":22.58,"lon":88.435,"type":"pub"},{"name":"Seagull Bar (Fort Kochi Waterfront)","city":"Kochi","state":"Kerala","country":"India","lat":9.967,"lon":76.244,"type":"bar"},{"name":"Mezzo Restobar (MG Road Kochi)","city":"Kochi","state":"Kerala","country":"India","lat":9.972,"lon":76.283,"type":"bar"},{"name":"C-Scheme Blackout Rooftop (Jaipur)","city":"Jaipur","state":"Rajasthan","country":"India","lat":26.912,"lon":75.801,"type":"nightclub"},{"name":"Ambrai Waterfront Lounge (Lake Pichola)","city":"Udaipur","state":"Rajasthan","country":"India","lat":24.579,"lon":73.681,"type":"bar"}];
      const SEED_ARMORY = [{"name":"DFW Tactical Armory Hub","city":"Dallas","state":"TX","country":"USA","lat":32.7767,"lon":-96.797,"type":"gun_store","desc":"Multi-dealer tactical defense firearms nexus"},{"name":"Houston Metro Armory District","city":"Houston","state":"TX","country":"USA","lat":29.7604,"lon":-95.3698,"type":"gun_store","desc":"Major high-capacity firearms & tactical retail strip"},{"name":"San Antonio Military Armory Zone","city":"San Antonio","state":"TX","country":"USA","lat":29.4241,"lon":-98.4936,"type":"gun_store","desc":"Military surplus & precision long-range supply"},{"name":"Austin Tactical Supply Corridor","city":"Austin","state":"TX","country":"USA","lat":30.2672,"lon":-97.7431,"type":"gun_store","desc":"Custom AR platforms & NFA Class 3 armory"},{"name":"El Paso Border Defense Armory","city":"El Paso","state":"TX","country":"USA","lat":31.7619,"lon":-106.485,"type":"gun_store","desc":"Border surveillance & tactical arms facility"},{"name":"Phoenix Valley Firearms District","city":"Phoenix","state":"AZ","country":"USA","lat":33.4484,"lon":-112.074,"type":"gun_store","desc":"Massive desert firearms retail & NFA silencer hub"},{"name":"Tucson Sporting Arms Center","city":"Tucson","state":"AZ","country":"USA","lat":32.2226,"lon":-110.9747,"type":"gun_store","desc":"Hunting rifles & precision ballistics equipment"},{"name":"Las Vegas Battlefield Mega-Armory","city":"Las Vegas","state":"NV","country":"USA","lat":36.136,"lon":-115.176,"type":"shooting_range","desc":"Heavy machine guns, military vehicles & full-auto range"},{"name":"Las Vegas Gun Store Corridor","city":"Las Vegas","state":"NV","country":"USA","lat":36.1,"lon":-115.143,"type":"shooting_range","desc":"Class 3 full-auto test firing & concealed carry depot"},{"name":"Reno High Sierra Armory","city":"Reno","state":"NV","country":"USA","lat":39.5296,"lon":-119.8138,"type":"gun_store","desc":"Tactical long guns & high-capacity magazine warehouse"},{"name":"Salt Lake Valley Tactical Complex","city":"Salt Lake City","state":"UT","country":"USA","lat":40.7608,"lon":-111.891,"type":"gun_store","desc":"Browning headquarters & precision bolt-action rifles"},{"name":"Denver Front Range Firearms","city":"Denver","state":"CO","country":"USA","lat":39.7392,"lon":-104.9903,"type":"gun_store","desc":"High-altitude sporting arms & tactical gear outpost"},{"name":"Colorado Springs Tactical Center","city":"Colorado Springs","state":"CO","country":"USA","lat":38.8339,"lon":-104.8214,"type":"gun_store","desc":"NORAD military corridor arms & optics depot"},{"name":"Albuquerque Sandia Tactical Supply","city":"Albuquerque","state":"NM","country":"USA","lat":35.0844,"lon":-106.6504,"type":"gun_store","desc":"Federal law enforcement & civilian defense armory"},{"name":"Boise Treasure Valley Armory","city":"Boise","state":"ID","country":"USA","lat":43.615,"lon":-116.2023,"type":"gun_store","desc":"Extreme 2A stronghold - bulk ammunition & survival armory"},{"name":"Anchorage Alaska Wilderness Armory","city":"Anchorage","state":"AK","country":"USA","lat":61.2181,"lon":-149.9003,"type":"gun_store","desc":"Big-bore dangerous game rifles (.45-70, .500 S&W)"},{"name":"Nashville Tactical Firearms Hub","city":"Nashville","state":"TN","country":"USA","lat":36.1627,"lon":-86.7816,"type":"gun_store","desc":"Barrett sniper rifle territory & custom gunsmithing"},{"name":"Knoxville Smoky Mountain Firearms","city":"Knoxville","state":"TN","country":"USA","lat":35.9606,"lon":-83.9207,"type":"gun_store","desc":"East Tennessee tactical & reloading megastore"},{"name":"Atlanta Tactical Defense Network","city":"Atlanta","state":"GA","country":"USA","lat":33.749,"lon":-84.388,"type":"gun_store","desc":"Glock USA headquarters proximity & duty firearm supplier"},{"name":"Savannah Coastal Tactical Supply","city":"Savannah","state":"GA","country":"USA","lat":32.0809,"lon":-81.0912,"type":"gun_store","desc":"Hunter AAF & tactical maritime defense equipment"},{"name":"Jacksonville Florida Gun Hub","city":"Jacksonville","state":"FL","country":"USA","lat":30.3322,"lon":-81.6557,"type":"gun_store","desc":"Naval air station defense arms & concealed carry"},{"name":"Tampa Bay Tactical Armory","city":"Tampa","state":"FL","country":"USA","lat":27.9506,"lon":-82.4572,"type":"gun_store","desc":"CENTCOM corridor military contractor & tactical arms"},{"name":"Orlando Central Florida Gun Corridor","city":"Orlando","state":"FL","country":"USA","lat":28.5383,"lon":-81.3792,"type":"gun_store","desc":"Tactical training academies & civilian arms retailers"},{"name":"Birmingham Central Alabama Armory","city":"Birmingham","state":"AL","country":"USA","lat":33.5186,"lon":-86.8104,"type":"gun_store","desc":"Deep South firearms distribution & tactical defense"},{"name":"Baton Rouge Cajun Armory Strip","city":"Baton Rouge","state":"LA","country":"USA","lat":30.4515,"lon":-91.1871,"type":"gun_store","desc":"Delta waterfowl sporting & tactical home defense"},{"name":"Indianapolis Crossroads Armory","city":"Indianapolis","state":"IN","country":"USA","lat":39.7684,"lon":-86.1581,"type":"gun_store","desc":"Major NRA convention hub & multi-lane tactical ranges"},{"name":"Kansas City Heartland Firearms","city":"Kansas City","state":"MO","country":"USA","lat":39.0997,"lon":-94.5786,"type":"gun_store","desc":"Midwest tactical rifles & bulk reloading components"},{"name":"Oklahoma City Red River Arms","city":"Oklahoma City","state":"OK","country":"USA","lat":35.4676,"lon":-97.5164,"type":"gun_store","desc":"Tinker AFB tactical supplier & competition shooting"},{"name":"Little Rock Arkansas Armory Zone","city":"Little Rock","state":"AR","country":"USA","lat":34.7465,"lon":-92.2896,"type":"gun_store","desc":"Remington ammunition plant proximity & tactical gear"},{"name":"Rapid City Black Hills Ammo Hub","city":"Rapid City","state":"SD","country":"USA","lat":44.0805,"lon":-103.231,"type":"gun_store","desc":"Match-grade military sniper ammunition manufacturing hub"},{"name":"Cheyenne Wyoming Frontier Armory","city":"Cheyenne","state":"WY","country":"USA","lat":41.14,"lon":-104.8202,"type":"gun_store","desc":"Unrestricted constitutional carry & tactical rifle depot"},{"name":"Calgary Alberta Tactical Supply","city":"Calgary","state":"AB","country":"Canada","lat":51.0447,"lon":-114.0719,"type":"gun_store","desc":"High-latitude long-range hunting & sporting firearms"},{"name":"Edmonton Northern Firearms Hub","city":"Edmonton","state":"AB","country":"Canada","lat":53.5461,"lon":-113.4938,"type":"gun_store","desc":"Wilderness defense & precision target rifles"},{"name":"CZ Uhersky Brod Factory Armory","city":"Uhersky Brod","state":"Zlin","country":"Czech Republic","lat":49.026,"lon":17.65,"type":"gun_store","desc":"CZ / Colt manufacturing global flagship facility"},{"name":"Prague Central Shooting Range & Armory","city":"Prague","state":"Prague","country":"Czech Republic","lat":50.08,"lon":14.43,"type":"shooting_range","desc":"Full-auto tactical range with AK-47, Scorpion & Bren"},{"name":"Brno Military Arms Dealers","city":"Brno","state":"South Moravian","country":"Czech Republic","lat":49.1951,"lon":16.6068,"type":"gun_store","desc":"Zbrojovka Brno historic weapon design center"},{"name":"Oberndorf Heckler & Koch Base","city":"Oberndorf","state":"Baden-Wurttemberg","country":"Germany","lat":48.298,"lon":8.572,"type":"gun_store","desc":"H&K MP5, G36 & HK416 global engineering center"},{"name":"Suhl Thuringian Gunsmithing Guild","city":"Suhl","state":"Thuringia","country":"Germany","lat":50.61,"lon":10.69,"type":"gun_store","desc":"500-year German master gunsmithing & hunting rifles"},{"name":"Ferlach Master Gunmakers Hub","city":"Ferlach","state":"Carinthia","country":"Austria","lat":46.526,"lon":14.3,"type":"gun_store","desc":"Handcrafted luxury hunting rifles & double rifles"},{"name":"Deutsch-Wagram Glock Global HQ","city":"Deutsch-Wagram","state":"Lower Austria","country":"Austria","lat":48.3,"lon":16.56,"type":"gun_store","desc":"Glock Safe Action pistol birthplace & testing facility"},{"name":"Neuhausen SIG Sauer Historic Works","city":"Neuhausen","state":"Schaffhausen","country":"Switzerland","lat":47.683,"lon":8.617,"type":"gun_store","desc":"Swiss military assault rifle (Stgw 90) design center"},{"name":"Zurich Swiss National Shooting Center","city":"Zurich","state":"Zurich","country":"Switzerland","lat":47.3769,"lon":8.5417,"type":"shooting_range","desc":"Citizen militia 300m assault rifle qualifying range"},{"name":"Gardone Val Trompia Beretta Valley","city":"Gardone Val Trompia","state":"Lombardy","country":"Italy","lat":45.692,"lon":10.183,"type":"gun_store","desc":"Oldest active weapons factory on Earth (Beretta 1526)"},{"name":"Herstal FN Herstal Defense Complex","city":"Herstal","state":"Liege","country":"Belgium","lat":50.6676,"lon":5.632,"type":"gun_store","desc":"FN SCAR, P90, Minimi & Five-seveN defense titan"},{"name":"Kragujevac Zastava Arms Complex","city":"Kragujevac","state":"Sumadija","country":"Serbia","lat":44.0128,"lon":20.9114,"type":"gun_store","desc":"Historic M70 Kalashnikov & anti-materiel rifle producer"},{"name":"Belgrade Tactical Military Depot","city":"Belgrade","state":"Belgrade","country":"Serbia","lat":44.7866,"lon":20.4489,"type":"gun_store","desc":"Balkan military surplus & export armory hub"},{"name":"Riihimaki Sako & Tikka Works","city":"Riihimaki","state":"Kanta-Hame","country":"Finland","lat":60.738,"lon":24.772,"type":"gun_store","desc":"Sako TRG sniper rifles & sub-MOA bolt actions"},{"name":"Helsinki Hunting & Tactical Arsenal","city":"Helsinki","state":"Uusimaa","country":"Finland","lat":60.1699,"lon":24.9384,"type":"gun_store","desc":"Arctic sniper optics & winter warfare tactical gear"},{"name":"Kongsberg Defense Dynamics","city":"Kongsberg","state":"Viken","country":"Norway","lat":59.668,"lon":9.65,"type":"gun_store","desc":"Nordic defense systems & remote weapon stations"},{"name":"Bangkok Wang Burapha Gun Quarter","city":"Bangkok","state":"Bangkok","country":"Thailand","lat":13.746,"lon":100.501,"type":"gun_store","desc":"Thailand historic legal firearms street (100+ gun shops)"},{"name":"Manila Marikina Arms Manufacturing","city":"Marikina","state":"Metro Manila","country":"Philippines","lat":14.65,"lon":121.1,"type":"gun_store","desc":"Armscor global 1911 pistol export factory hub"},{"name":"Tokyo Akihabara Tactical Gear Row","city":"Tokyo","state":"Tokyo","country":"Japan","lat":35.698,"lon":139.771,"type":"gun_store","desc":"World capital of mil-spec Tokyo Marui airsoft & optics"},{"name":"Sydney St Marys Indoor Shooting Complex","city":"Sydney","state":"NSW","country":"Australia","lat":-33.766,"lon":150.775,"type":"shooting_range","desc":"State-of-the-art multi-discipline firearms range"},{"name":"Brisbane Belmont Shooting Complex","city":"Brisbane","state":"QLD","country":"Australia","lat":-27.525,"lon":153.136,"type":"shooting_range","desc":"Oceania largest Olympic & tactical shooting range"},{"name":"Auckland Tactical Shooting Range","city":"Auckland","state":"Auckland","country":"New Zealand","lat":-36.8485,"lon":174.7633,"type":"shooting_range","desc":"Precision long-range sporting rifle facility"},{"name":"Abu Dhabi Tawazun Industrial Park","city":"Abu Dhabi","state":"Abu Dhabi","country":"UAE","lat":24.4539,"lon":54.3773,"type":"gun_store","desc":"Caracal combat pistol & sniper rifle manufacturing"},{"name":"Dubai Hunting & Equestrian Armory","city":"Dubai","state":"Dubai","country":"UAE","lat":25.2048,"lon":55.2708,"type":"gun_store","desc":"ADIHEX luxury engraved sporting rifles & shotguns"},{"name":"Riyadh Military Defense City","city":"Riyadh","state":"Riyadh","country":"Saudi Arabia","lat":24.7136,"lon":46.6753,"type":"gun_store","desc":"World Defense Show & national arms exhibition center"},{"name":"Amman KADDB Defense Design Center","city":"Amman","state":"Amman","country":"Jordan","lat":31.9454,"lon":35.9284,"type":"gun_store","desc":"Jordanian King Abdullah tactical vehicle & weapons hub"},{"name":"Ramat HaSharon IWI Armory Complex","city":"Ramat HaSharon","state":"Tel Aviv","country":"Israel","lat":32.146,"lon":34.84,"type":"gun_store","desc":"Tavor, Galil ACE, Uzi & Negev machine gun factory"},{"name":"Peshawar Frontier Arms Bazaar","city":"Peshawar","state":"KPK","country":"Pakistan","lat":34.0151,"lon":71.5805,"rate":50,"type":"gun_store","desc":"Historic handcrafted firearms & custom gunsmith shops"},{"name":"Pretoria Denel Tactical Complex","city":"Pretoria","state":"Gauteng","country":"South Africa","lat":-25.7479,"lon":28.2293,"type":"gun_store","desc":"South African defense giant - anti-materiel NTW-20 & ammo"},{"name":"Johannesburg Tactical Defense Hub","city":"Johannesburg","state":"Gauteng","country":"South Africa","lat":-26.2041,"lon":28.0473,"type":"gun_store","desc":"Private security tactical gear, body armor & shotguns"},{"name":"Windhoek Safari & Big Game Arms","city":"Windhoek","state":"Khomas","country":"Namibia","lat":-22.5609,"lon":17.0658,"type":"gun_store","desc":"Dangerous African safari dangerous-game rifles & ammo"},{"name":"Nairobi Kenya Shooting Federation","city":"Nairobi","state":"Nairobi","country":"Kenya","lat":-1.2921,"lon":36.8219,"type":"shooting_range","desc":"East Africa premier sporting & tactical range"},{"name":"Mexico City DCAM Army Armory","city":"Mexico City","state":"CDMX","country":"Mexico","lat":19.4326,"lon":-99.215,"type":"gun_store","desc":"Direccion de Comercializacion de Armamento SEDENA"},{"name":"Panama City Tactical Outpost","city":"Panama City","state":"Panama","country":"Panama","lat":8.9824,"lon":-79.5199,"type":"gun_store","desc":"Canal maritime security & tactical operations depot"},{"name":"Asuncion Tactical Arms Center","city":"Asuncion","state":"Central","country":"Paraguay","lat":-25.2637,"lon":-57.5759,"type":"gun_store","desc":"South American commercial sporting arms & defense store"},{"name":"Rifle Factory Ishapore (RFI Est 1904)","city":"Ishapore","state":"West Bengal","country":"India","lat":22.812,"lon":88.373,"type":"gun_store","desc":"India oldest small arms factory - producer of INSAS, Ghatak assault rifles & civilian .315 hunting rifles"},{"name":"Small Arms Factory Kanpur (SAF / AWEIL)","city":"Kanpur","state":"Uttar Pradesh","country":"India","lat":26.442,"lon":80.347,"type":"gun_store","desc":"Primary state producer of civilian defensive revolvers (.32 Nirbheek, Mark IV) and Ashani 9mm/.32 pistols"},{"name":"Ordnance Factory Tiruchirappalli (OFT)","city":"Tiruchirappalli","state":"Tamil Nadu","country":"India","lat":10.742,"lon":78.791,"type":"gun_store","desc":"Defense manufacturer of Trichy Assault Rifle (TAR 7.62), indigenous carbines & multi-grenade launchers"},{"name":"Gun & Shell Factory Cossipore (Est 1801)","city":"Kolkata","state":"West Bengal","country":"India","lat":22.628,"lon":88.375,"type":"gun_store","desc":"India historic premier artillery, shell casing & heavy armament design factory"},{"name":"Field Gun Factory Kanpur","city":"Kanpur","state":"Uttar Pradesh","country":"India","lat":26.435,"lon":80.36,"type":"gun_store","desc":"Manufactures high-caliber defense weapons, tank barrels & specialized defense metallurgy"},{"name":"Gun Carriage Factory Jabalpur (GCF)","city":"Jabalpur","state":"Madhya Pradesh","country":"India","lat":23.185,"lon":79.98,"type":"gun_store","desc":"Indigenous 155mm Dhanush howitzer, artillery carriages & defense armory complex"},{"name":"SSS Defence Sniper Hub (Bengaluru)","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.835,"lon":77.675,"type":"gun_store","desc":"India premier private-sector defense sniper rifle (.338 Lapua Saber), assault rifle & tactical gear innovator"},{"name":"PLR Systems Weapons Facility","city":"Gwalior","state":"Madhya Pradesh","country":"India","lat":26.218,"lon":78.182,"type":"gun_store","desc":"Joint venture defense armory producing Tavor assault rifles, Galil sniper systems & X95 carbines"},{"name":"Pandoh Gun House (Est 1948)","city":"New Delhi","state":"Delhi","country":"India","lat":28.666,"lon":77.228,"type":"gun_store","desc":"Historic licensed dealer of civilian revolvers, 12-gauge shotguns & ammunition at Kashmere Gate"},{"name":"Pioneer Arms Co (Connaught Place)","city":"New Delhi","state":"Delhi","country":"India","lat":28.632,"lon":77.219,"type":"gun_store","desc":"Premier registered civilian firearms emporium in Central Delhi (licensed sport & defense arms)"},{"name":"D.N. Sondhi & Co Arms Mart","city":"New Delhi","state":"Delhi","country":"India","lat":28.667,"lon":77.227,"type":"gun_store","desc":"Government-authorized dealer of ammunition, sporting rifles & licensed security revolvers"},{"name":"Manton & Co Gunmakers (Est 1825)","city":"Kolkata","state":"West Bengal","country":"India","lat":22.571,"lon":88.351,"type":"gun_store","desc":"India most legendary historic royal gunsmith; custom double rifles & shotguns built for Maharajas"},{"name":"R.B. Rodda & Co Arms Emporium","city":"Kolkata","state":"West Bengal","country":"India","lat":22.569,"lon":88.35,"type":"gun_store","desc":"Famous British-Indian era sporting armory & authorized distributor of cartridges & hunting rifles"},{"name":"A.A. Shaik & Bros Arms Dealers","city":"Mumbai","state":"Maharashtra","country":"India","lat":18.932,"lon":72.834,"type":"gun_store","desc":"Licensed civilian arms merchants in Fort Mumbai - defensive pistols, air rifles & shotgun shells"},{"name":"Tahir Arms & Ammunition Corp","city":"Mumbai","state":"Maharashtra","country":"India","lat":18.948,"lon":72.835,"type":"gun_store","desc":"Authorized firearms dealer near Crawford Market for sporting guns and licensed personal defense weapons"},{"name":"Oriental Arms & Ammunition","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.089,"lon":80.286,"type":"gun_store","desc":"Historic licensed gun dealer on Armenian Street, George Town - shotguns & licensed handguns"},{"name":"Simpson & Co Defense Supplies","city":"Chennai","state":"Tamil Nadu","country":"India","lat":13.072,"lon":80.271,"type":"gun_store","desc":"Historic British engineering works on Mount Road associated with defense machining & sporting supply"},{"name":"Bangalore Armoury & Gun Works","city":"Bengaluru","state":"Karnataka","country":"India","lat":12.973,"lon":77.608,"type":"gun_store","desc":"Licensed civilian firearms and national competition shooting sports distributor near MG Road"},{"name":"Deccan Arms Corporation","city":"Hyderabad","state":"Telangana","country":"India","lat":17.391,"lon":78.473,"type":"gun_store","desc":"Nizam-era authorized gunsmith & registered sporting weapon distributor at Abids"},{"name":"Royal Arms Corporation (Hazratganj)","city":"Lucknow","state":"Uttar Pradesh","country":"India","lat":26.85,"lon":80.942,"type":"gun_store","desc":"Premier registered Uttar Pradesh civilian showroom for IOF .32 revolvers and 12-bore sporting guns"},{"name":"Awadh Gun House (Aminabad)","city":"Lucknow","state":"Uttar Pradesh","country":"India","lat":26.844,"lon":80.929,"type":"gun_store","desc":"Authorized dealer of government factory firearms, cartridges and hunting optical gear"},{"name":"Meerut Arms & Ammunition Mart","city":"Meerut","state":"Uttar Pradesh","country":"India","lat":28.988,"lon":77.702,"type":"gun_store","desc":"Licensed Sadar Bazaar sporting gun store supplying clay target shooters and licensed civilian arms"},{"name":"Mahajan Gun House (Jammu Tawi)","city":"Jammu","state":"Jammu and Kashmir","country":"India","lat":32.726,"lon":74.857,"type":"gun_store","desc":"Premier registered distributor in J&K for DBBL/SBBL 12-gauge shotguns and licensed cartridges"},{"name":"Kashmir Arms Corporation","city":"Srinagar","state":"Jammu and Kashmir","country":"India","lat":34.072,"lon":74.81,"type":"gun_store","desc":"Historic licensed firearms dealer on Residency Road Srinagar for sport and estate defense arms"},{"name":"Ludhiana Gun House (Clock Tower)","city":"Ludhiana","state":"Punjab","country":"India","lat":30.912,"lon":75.853,"type":"gun_store","desc":"Major licensed firearms hub in Punjab - high-grade sporting shotguns, revolvers & clay sports"},{"name":"Amritsar Arms & Ammunition Store","city":"Amritsar","state":"Punjab","country":"India","lat":31.633,"lon":74.876,"type":"gun_store","desc":"Historic Hall Bazaar licensed civilian arms dealer for Punjab competitive shooters"},{"name":"Royal Arms & Ammunition (Johari Bazaar)","city":"Jaipur","state":"Rajasthan","country":"India","lat":26.92,"lon":75.826,"type":"gun_store","desc":"Traditional Rajputana registered firearms dealer for Shikar hunting rifles & vintage sporting pieces"},{"name":"Jodhpur Shikar Gun Depot","city":"Jodhpur","state":"Rajasthan","country":"India","lat":26.29,"lon":73.023,"type":"gun_store","desc":"Licensed civilian arms dealer near Sojati Gate catering to shooting ranges and licensed owners"},{"name":"Bihar Gun House (Dak Bungalow)","city":"Patna","state":"Bihar","country":"India","lat":25.609,"lon":85.137,"type":"gun_store","desc":"Authorized government civilian arms and cartridge dealer for licensed security & personal defense"},{"name":"Kamakhya Arms Co (Paltan Bazaar)","city":"Guwahati","state":"Assam","country":"India","lat":26.182,"lon":91.751,"type":"gun_store","desc":"Premier registered firearms and ammunition distributor for Northeast India tea estates & sport"},{"name":"Bass Pro Shops Outdoor World (Flagship)","city":"Springfield","state":"MO","country":"USA","lat":37.178,"lon":-93.298,"type":"gun_store","desc":"The Granddaddy of All Outdoor Stores (500,000 sq ft) with historic firearms museum and gun room"},{"name":"Buds Gun Shop & Indoor Range","city":"Lexington","state":"KY","country":"USA","lat":38.03,"lon":-84.5,"type":"shooting_range","desc":"World largest civilian firearms retailer with massive indoor tactical range"},{"name":"Palmetto State Armory Flagship","city":"Columbia","state":"SC","country":"USA","lat":34,"lon":-81.034,"type":"gun_store","desc":"Leading AR-15 and civilian defense platform manufacturer & retail superstore"},{"name":"Collectors Firearms Houston","city":"Houston","state":"TX","country":"USA","lat":29.734,"lon":-95.495,"type":"gun_store","desc":"Over 12,000 firearms in stock - world-famous museum-grade historical & modern armory"},{"name":"Kittery Trading Post Firearms","city":"Kittery","state":"ME","country":"USA","lat":43.09,"lon":-70.736,"type":"gun_store","desc":"New England legendary sporting firearms emporium with massive vintage gun room"},{"name":"Tombstone Tactical Superstore","city":"Chino Valley","state":"AZ","country":"USA","lat":34.757,"lon":-112.453,"type":"gun_store","desc":"Premier Southwest tactical firearms, Class 3 NFA suppressors & duty rifle depot"},{"name":"Holland & Holland Gun Room (Mayfair)","city":"London","state":"England","country":"UK","lat":51.511,"lon":-0.142,"type":"gun_store","desc":"World most prestigious bespoke royal gunmaker since 1835 (Bruton Street, Mayfair)"},{"name":"James Purdey & Sons (Audley House)","city":"London","state":"England","country":"UK","lat":51.509,"lon":-0.15,"type":"gun_store","desc":"Royal warrant holder - legendary handmade London sporting shotguns and rifles"},{"name":"John Rigby & Co Gunmakers","city":"London","state":"England","country":"UK","lat":51.472,"lon":-0.138,"type":"gun_store","desc":"Historic maker of African dangerous-game big bore rifles (.416 Rigby, .450 NE) since 1775"},{"name":"Beretta Gallery Milano (Via Durini)","city":"Milan","state":"Lombardy","country":"Italy","lat":45.466,"lon":9.198,"type":"gun_store","desc":"Luxury flagship showcase of Fabbrica d Armi Pietro Beretta luxury sporting firearms"},{"name":"Blaser Jagdwaffen Precision Arms","city":"Isny im Allgau","state":"Baden-Wurttemberg","country":"Germany","lat":47.693,"lon":10.04,"type":"gun_store","desc":"Pioneers of the R8 straight-pull precision bolt rifle & tactical sniper systems"},{"name":"Krieghoff Competition Arms","city":"Ulm","state":"Baden-Wurttemberg","country":"Germany","lat":48.401,"lon":9.987,"type":"gun_store","desc":"Olympic champion competition trap/skeet K-80 shotguns and fine hunting double rifles"}];

      
      const SEED_PRISONS = [{"id":"prz-adx","name":"ADX Florence (Federal Supermax)","city":"Florence","state":"CO","country":"USA","lat":38.358,"lon":-105.1,"capacity":"490","security":"SUPERMAX / CONTROL UNIT","escapeRisk":"ZERO (Historical)","inmates":"El Chapo, Ted Kaczynski, Zacarias Moussaoui, Ramzi Yousef","desc":"Alcatraz of the Rockies - 23-hour solitary confinement in soundproof concrete cells"},{"id":"prz-pel","name":"Pelican Bay State Prison (SHU)","city":"Crescent City","state":"CA","country":"USA","lat":41.789,"lon":-124.15,"capacity":"2,380","security":"MAXIMUM LEVEL IV","escapeRisk":"EXTREME LOW","inmates":"Aryan Brotherhood, Mexican Mafia & Nuestra Familia leadership","desc":"Supermax Security Housing Unit (SHU) designed for high-ranking cartel and prison gang shot-callers"},{"id":"prz-rik","name":"Rikers Island Jail Complex","city":"New York","state":"NY","country":"USA","lat":40.793,"lon":-73.886,"capacity":"10,000","security":"MAXIMUM URBAN","escapeRisk":"MODERATE","inmates":"High-profile NYC detainees, organized crime, violent syndicates","desc":"Infamous island jail fortress in East River plagued by gang violence and structural lockdowns"},{"id":"prz-ang","name":"Louisiana State Penitentiary (Angola)","city":"Angola","state":"LA","country":"USA","lat":30.957,"lon":-91.606,"capacity":"6,300","security":"MAXIMUM FARM","escapeRisk":"LOW (Mississippi River perimeter)","inmates":"Death row inmates, lifers, violent cartel enforcers","desc":"Largest maximum-security prison in the US (18,000 acres) surrounded by alligator-infested river waters"},{"id":"prz-sq","name":"San Quentin Rehabilitation Center","city":"San Rafael","state":"CA","country":"USA","lat":37.938,"lon":-122.487,"capacity":"3,300","security":"MAXIMUM / DEATH ROW","escapeRisk":"LOW","inmates":"California death row condemned inmates, Charles Manson (formerly)","desc":"Oldest operating prison in California (est 1852) with historic gas chamber and death row"},{"id":"prz-ter","name":"USP Terre Haute (Federal Death Row)","city":"Terre Haute","state":"IN","country":"USA","lat":39.412,"lon":-87.452,"capacity":"1,500","security":"MAXIMUM / SPECIAL CONFINEMENT","escapeRisk":"ZERO","inmates":"Timothy McVeigh (executed), Dzhokhar Tsarnaev (Boston bomber)","desc":"Houses the federal death chamber and Special Confinement Unit for all federal death row inmates"},{"id":"prz-gtmo","name":"Guantanamo Bay Detention Camp (Camp Delta)","city":"Guantanamo Bay","state":"Naval Base","country":"Cuba / US","lat":19.902,"lon":-75.099,"capacity":"780 (Peak)","security":"MILITARY MAXIMUM CLASSIFIED","escapeRisk":"ZERO","inmates":"High-value Al-Qaeda detainees, Khalid Sheikh Mohammed","desc":"Naval military detention center for global high-value terror combatants and classified detainees"},{"id":"prz-cecot","name":"CECOT (Terrorism Confinement Center)","city":"Tecoluca","state":"San Vicente","country":"El Salvador","lat":13.535,"lon":-88.665,"capacity":"40,000","security":"SUPERMAX MEGA-PRISON","escapeRisk":"EXTREME LOW","inmates":"MS-13 & Barrio 18 gang commanders and hitmen","desc":"World largest mega-prison built by Nayib Bukele; 40,000 gang members under 24/7 total electrical surveillance"},{"id":"prz-alt","name":"Altiplano Federal Prison (El Altiplano)","city":"Almoloya de Juarez","state":"State of Mexico","country":"Mexico","lat":19.416,"lon":-99.748,"capacity":"1,100","security":"FEDERAL LEVEL 5 SUPERMAX","escapeRisk":"HIGH (Tunnel site of El Chapo 2015)","inmates":"Zetas, Sinaloa & CJNG cartel bosses, Servando Gomez","desc":"Mexico highest-security federal prison, site of armored perimeters and anti-drone electronic jamming"},{"id":"prz-ban","name":"Bangu Penitentiary Complex","city":"Rio de Janeiro","state":"RJ","country":"Brazil","lat":-22.871,"lon":-43.468,"capacity":"8,000","security":"MAXIMUM MILITARY-POLICE","escapeRisk":"MODERATE","inmates":"Comando Vermelho (CV) & Terceiro Comando Puro (TCP) bosses","desc":"Site of fierce gang faction massacres, electronic signal jammers and armored battalion gates"},{"id":"prz-toc","name":"Tocoron Prison (Tren de Aragua Fortress)","city":"Tocoron","state":"Aragua","country":"Venezuela","lat":10.052,"lon":-67.604,"capacity":"7,000","security":"FORMER CARTEL MEGA-CITADEL","escapeRisk":"HIGH","inmates":"Tren de Aragua international crime syndicate leadership","desc":"Underground tunnels, luxury nightclubs, private zoo and weapons armory seized by 11,000 troops in 2023"},{"id":"prz-blk","name":"Black Dolphin Prison (IK-6)","city":"Sol-Iletsk","state":"Orenburg","country":"Russia","lat":51.155,"lon":54.996,"capacity":"1,600","security":"SPECIAL REGIME MAXIMUM","escapeRisk":"ZERO (Zero Escapes)","inmates":"Cannibals, serial killers, Beslan terrorists, mass murderers","desc":"Prisoners are blindfolded when walking outside cells, bent double in handcuffs; lifers only"},{"id":"prz-wht","name":"White Swan Prison (VK-240/2)","city":"Solikamsk","state":"Perm Krai","country":"Russia","lat":59.646,"lon":56.772,"capacity":"900","security":"SPECIAL REGIME ISOLATION","escapeRisk":"ZERO","inmates":"Chechen warlords, thieves-in-law (vory v zakone)","desc":"Designed to break the authority of Soviet-era underworld bosses; strict psychological isolation"},{"id":"prz-bel","name":"HMP Belmarsh (High Security Unit)","city":"London","state":"England","country":"UK","lat":51.496,"lon":0.093,"capacity":"900","security":"CATEGORY A HIGH SECURITY","escapeRisk":"EXTREME LOW","inmates":"Julian Assange (formerly), Abu Hamza, IRA & ISIS terrorists","desc":"Britain most secure prison; underground tunnel connects directly to Woolwich Crown Court"},{"id":"prz-san","name":"La Sante Prison (Quartier d Isolement)","city":"Paris","state":"Ile-de-France","country":"France","lat":48.834,"lon":2.339,"capacity":"1,000","security":"MAXIMUM ISOLATION","escapeRisk":"VERY LOW","inmates":"Carlos the Jackal, Manuel Noriega (formerly), mafia capos","desc":"Historic central Paris prison featuring subterranean high-security isolation quarters"},{"id":"prz-tih","name":"Tihar Prison Complex (Asia Largest)","city":"New Delhi","state":"Delhi","country":"India","lat":28.625,"lon":77.1,"capacity":"10,026 (Holds 20,000+)","security":"MAXIMUM SECURITY METRO","escapeRisk":"LOW","inmates":"Underworld dons, Olympic medalists turned gangsters, terrorists, Chhota Rajan","desc":"Asia largest prison complex (400 acres); 9 central jails, high-security wards and jammer towers"},{"id":"prz-art","name":"Arthur Road Jail (Mumbai Central)","city":"Mumbai","state":"Maharashtra","country":"India","lat":18.989,"lon":72.828,"capacity":"1,074 (Holds 3,000+)","security":"MAXIMUM BULLET-PROOF BARRACKS","escapeRisk":"ZERO","inmates":"Ajmal Kasab (26/11 terrorist), D-Company underworld hitmen","desc":"Home to bomb-proof, bullet-proof Barrack 12 fortified with blast walls and paramilitary commandos"},{"id":"prz-yer","name":"Yerwada Central Jail (High Security)","city":"Pune","state":"Maharashtra","country":"India","lat":18.552,"lon":73.886,"capacity":"5,000","security":"MAXIMUM SECURITY JAIL","escapeRisk":"VERY LOW","inmates":"Ajmal Kasab (hanged here), Yakub Memon, gangsters, political prisoners","desc":"Historic 512-acre fortress with Fasi Yard (execution yard) and automated biometric perimeter gates"},{"id":"prz-bng","name":"Bang Kwang Central Prison (Bangkok Hilton)","city":"Nonthaburi","state":"Nonthaburi","country":"Thailand","lat":13.845,"lon":100.493,"capacity":"8,000","security":"MAXIMUM DEATH ROW","escapeRisk":"EXTREME LOW","inmates":"International narcotics traffickers, death row inmates in heavy leg irons","desc":"Legendary maximum-security prison where inmates were historically shackled in permanent leg irons"},{"id":"prz-evi","name":"Evin Prison (Ward 209)","city":"Tehran","state":"Tehran","country":"Iran","lat":35.795,"lon":51.385,"capacity":"15,000","security":"POLITICAL / INTELLIGENCE MAXIMUM","escapeRisk":"ZERO","inmates":"Political dissidents, dual-nationals, intelligence targets, journalists","desc":"Administered partly by Ministry of Intelligence (MOIS); interrogation suites and solitary isolation"},{"id":"prz-tad","name":"Tadmur Military Prison Ruins","city":"Palmyra","state":"Homs","country":"Syria","lat":34.56,"lon":38.27,"capacity":"Historical Fortress","security":"FORMER EXTREME DETENTION","escapeRisk":"N/A","inmates":"Political prisoners, Muslim Brotherhood, dissidents","desc":"Described by Amnesty as one of the most oppressive prisons on Earth before being blown up by ISIS in 2015"},{"id":"prz-hai","name":"Al-Hair Prison Supermax","city":"Riyadh","state":"Riyadh","country":"Saudi Arabia","lat":24.417,"lon":46.865,"capacity":"10,000","security":"SUPERMAX / COUNTER-TERROR","escapeRisk":"ZERO","inmates":"Al-Qaeda & ISIS leadership, royal family detainees, national security threats","desc":"Ultra-modern high-tech surveillance, blast-proof subterranean wings and biometric gate corridors"},{"id":"prz-qin","name":"Qincheng Prison (Tigers Cage)","city":"Beijing","state":"Beijing","country":"China","lat":40.239,"lon":116.386,"capacity":"3,000","security":"SPECIAL MINISTRY OF PUBLIC SECURITY","escapeRisk":"ZERO","inmates":"Bo Xilai, Zhou Yongkang, fallen Politburo members, high-ranking spies","desc":"China top-secret political prison for high-level fallen officials (Tigers) under 24/7 video monitoring"}];
      const SEED_BUNKERS = [{"id":"bnk-cyn","name":"Cheyenne Mountain Complex (NORAD HQ)","city":"Colorado Springs","state":"CO","country":"USA","lat":38.744,"lon":-104.846,"depthMeters":610,"blastResistance":"30 Megatons","capacity":"1,000+","status":"ACTIVE STANDBY","desc":"Solid granite mountain fortress built on 1,300 heavy steel springs; protected by two 25-ton blast doors"},{"id":"bnk-rvn","name":"Raven Rock Mountain Complex (Site R)","city":"Fairfield","state":"PA","country":"USA","lat":39.734,"lon":-77.419,"depthMeters":200,"blastResistance":"Nuclear EMP / Direct Hit","capacity":"3,000","status":"ACTIVE FULLY OPERATIONAL","desc":"The Underground Pentagon - complete shadow Department of Defense command center hollowed out in greenstone rock"},{"id":"bnk-wth","name":"Mount Weather Emergency Operations Center","city":"Bluemont","state":"VA","country":"USA","lat":39.063,"lon":-77.889,"depthMeters":150,"blastResistance":"Thermonuclear Surface Blast","capacity":"2,500","status":"ACTIVE FULLY OPERATIONAL","desc":"Primary continuity of government site for US Cabinet & Supreme Court; FEMA classified disaster command"},{"id":"bnk-grn","name":"Greenbrier Bunker (Project Greek Island)","city":"White Sulphur Springs","state":"WV","country":"USA","lat":37.788,"lon":-80.308,"depthMeters":25,"blastResistance":"Thermonuclear Overpressure","capacity":"1,100","status":"DECOMMISSIONED / HISTORIC","desc":"Secret 112,544 sq ft bunker built beneath luxury resort to house US Congress in event of nuclear war"},{"id":"bnk-oln","name":"Olney Federal Support Center","city":"Olney","state":"MD","country":"USA","lat":39.208,"lon":-77.086,"depthMeters":40,"blastResistance":"Nuclear EMP Shielded","capacity":"500","status":"ACTIVE HIGHLY CLASSIFIED","desc":"Underground communications and continuity routing hub linked to White House communications network"},{"id":"bnk-yam","name":"Mount Yamantau Subterranean Complex","city":"Mezhgorye","state":"Bashkortostan","country":"Russia","lat":54.255,"lon":58.103,"depthMeters":1000,"blastResistance":"Direct Nuclear Strike Immune","capacity":"60,000","status":"ACTIVE TOP SECRET","desc":"Massive subterranean nuclear city hollowed inside quartz mountain; served by dedicated military railroad"},{"id":"bnk-kos","name":"Kosvinsky Kamen Nuclear Command","city":"Kytlym","state":"Sverdlovsk Oblast","country":"Russia","lat":59.516,"lon":59.056,"depthMeters":350,"blastResistance":"EMP Hardened / Nuclear Bunker Buster Proof","capacity":"2,000","status":"ACTIVE STRATEGIC COMMAND","desc":"Primary Russian nuclear warhead command post built to withstand deep-penetrating nuclear bunker busters"},{"id":"bnk-m2","name":"Metro-2 (D-6) Secret Subterranean Transit","city":"Moscow","state":"Moscow","country":"Russia","lat":55.751,"lon":37.618,"depthMeters":120,"blastResistance":"Nuclear Surface Burst Proof","capacity":"10,000","status":"CLASSIFIED ACTIVE","desc":"Alleged secret subterranean railway network connecting Kremlin to FSB HQ, Vnukovo-2 airfield and Yamantau"},{"id":"bnk-sva","name":"Svalbard Global Seed Vault (Doomsday Vault)","city":"Longyearbyen","state":"Spitsbergen","country":"Norway","lat":78.238,"lon":15.491,"depthMeters":130,"blastResistance":"Nuclear Winter / Permafrost Immune","capacity":"4.5M Seed Samples","status":"ACTIVE GLOBAL REDOUBT","desc":"Built deep inside Arctic permafrost mountain to preserve world agricultural genetic history against apocalypse"},{"id":"bnk-bur","name":"Burlington Bunker (Central Government War HQ)","city":"Corsham","state":"Wiltshire","country":"UK","lat":51.433,"lon":-2.19,"depthMeters":35,"blastResistance":"Nuclear Overpressure Resistant","capacity":"4,000","status":"DECOMMISSIONED HISTORIC","desc":"35-acre underground nuclear city in former quarry with 60 miles of roads, bakery, hospital and secret rail line"},{"id":"bnk-klv","name":"Kelvedon Hatch Secret Nuclear Bunker","city":"Brentwood","state":"Essex","country":"UK","lat":51.67,"lon":0.258,"depthMeters":38,"blastResistance":"Megaton Airburst Proof","capacity":"600","status":"DECOMMISSIONED MUSEUM","desc":"Three-level blast bunker beneath rural bungalow designed to govern London and Southeast England post-strike"},{"id":"bnk-son","name":"Sonnenberg Tunnel Fallout Shelter","city":"Lucerne","state":"Lucerne","country":"Switzerland","lat":47.045,"lon":8.293,"depthMeters":30,"blastResistance":"Megaton Shockwave Resistant","capacity":"20,000","status":"CIVIL PROTECTION STANDBY","desc":"World largest civilian nuclear fallout shelter constructed inside twin highway tunnels with hospital and command"},{"id":"bnk-ark","name":"Tito Nuclear Bunker (ARK D-0)","city":"Konjic","state":"Herzegovina","country":"Bosnia and Herzegovina","lat":43.633,"lon":17.994,"depthMeters":280,"blastResistance":"25 Kiloton Direct Hit","capacity":"350","status":"PRESERVED HISTORIC","desc":"Yugoslavia top-secret horseshoe-shaped command shelter hidden inside Mount Zlatar for Josip Broz Tito"},{"id":"bnk-816","name":"Project 816 Underground Nuclear Plant","city":"Fuling","state":"Chongqing","country":"China","lat":29.704,"lon":107.502,"depthMeters":400,"blastResistance":"1000lb Bomb / 1M Ton Nuclear Strike","capacity":"10,000","status":"DECOMMISSIONED GIGANTIC COMPLEX","desc":"World largest artificial underground military cave complex; 18 caves and 130 shafts built to produce plutonium"}];
      const SEED_BIOLABS = [{"id":"bio-det","name":"USAMRIID (Fort Detrick)","city":"Frederick","state":"MD","country":"USA","lat":39.435,"lon":-77.426,"level":"BSL-4 MAXIMUM","agency":"US Army Medical Research Institute of Infectious Diseases","pathogens":"Ebola, Marburg, Anthrax, Smallpox, Plague, Venezuelan Equine Encephalitis","airFiltration":"Negative Pressure Double HEPA","desc":"The Department of Defense primary bio-defense research laboratory and global hot agent containment fortress"},{"id":"bio-cdc","name":"CDC Roybal Campus Building 18","city":"Atlanta","state":"GA","country":"USA","lat":33.799,"lon":-84.328,"level":"BSL-4 MAXIMUM","agency":"Centers for Disease Control and Prevention","pathogens":"Variola virus (Smallpox official repository), Ebola, Lassa fever, Crimea-Congo","airFiltration":"Multi-Stage Certified HEPA Negative","desc":"Houses one of only two official WHO repositories of live Variola major (Smallpox) virus in the world"},{"id":"bio-rml","name":"NIAID Rocky Mountain Laboratories","city":"Hamilton","state":"MT","country":"USA","lat":46.247,"lon":-114.162,"level":"BSL-4 MAXIMUM","agency":"National Institutes of Health (NIH / NIAID)","pathogens":"Ebola, Hantavirus, Tick-borne encephalitis, SARS-CoV, Prions","airFiltration":"Class III Biosafety Glovebox + Suits","desc":"High-containment facility dedicated to emergent vector-borne pathogens and viral hemorrhagic fevers"},{"id":"bio-txb","name":"Texas Biomedical Research Institute","city":"San Antonio","state":"TX","country":"USA","lat":29.45,"lon":-98.618,"level":"BSL-4 MAXIMUM","agency":"Private Independent Research","pathogens":"Filoviruses (Ebola Zaire, Sudan), Arenaviruses (Guanarito, Machupo)","airFiltration":"Positive Pressure Space Suit Lab","desc":"First privately owned BSL-4 maximum containment laboratory in the United States"},{"id":"bio-gnl","name":"Galveston National Laboratory (UTMB)","city":"Galveston","state":"TX","country":"USA","lat":29.311,"lon":-94.776,"level":"BSL-4 MAXIMUM","agency":"University of Texas Medical Branch","pathogens":"Henipavirus (Nipah, Hendra), Crimean-Congo hemorrhagic fever","airFiltration":"Independent Dedicated Exhaust HEPA Systems","desc":"One of the largest active biocontainment facilities on a US university campus"},{"id":"bio-nml","name":"National Microbiology Laboratory (Winnipeg)","city":"Winnipeg","state":"MB","country":"Canada","lat":49.904,"lon":-97.16,"level":"BSL-4 MAXIMUM","agency":"Public Health Agency of Canada","pathogens":"Ebola, Marburg, Lassa, Crimean-Congo, Highly Pathogenic Avian Influenza","airFiltration":"Redundant Air Filtration Systems","desc":"Canada sole level-4 containment facility; developer of the VSV-EBOV Ebola vaccine"},{"id":"bio-ptn","name":"DSTL Porton Down Science Park","city":"Salisbury","state":"Wiltshire","country":"UK","lat":51.132,"lon":-1.705,"level":"BSL-4 / CBRN DEFENSE","agency":"Defence Science and Technology Laboratory","pathogens":"Nerve agents (Novichok, VX), Anthrax, Ebola, Tularemia, Plague","airFiltration":"Triple Military-Grade HEPA filtration","desc":"Britain highly secret chemical & biological warfare research facility founded in 1916 during WWI"},{"id":"bio-ins","name":"Laboratoire P4 Jean Merieux (INSERM)","city":"Lyon","state":"Auvergne-Rhone-Alpes","country":"France","lat":45.727,"lon":4.828,"level":"BSL-4 MAXIMUM","agency":"Institut National de la Sante et de la Recherche Medicale","pathogens":"Ebola, Marburg, Lassa, Junin, Sabia, Guanarito","airFiltration":"Hermetic Negative Pressure Suits","desc":"Premier European high-security bio-research laboratory and model design for overseas P4 facilities"},{"id":"bio-rki","name":"Robert Koch Institute (RKI Seestrasse)","city":"Berlin","state":"Berlin","country":"Germany","lat":52.544,"lon":13.348,"level":"BSL-4 MAXIMUM","agency":"Federal Institute for Infectious and Non-Communicable Diseases","pathogens":"Ebolavirus, Lassa, Crimean-Congo, Rabies virus strains","airFiltration":"Hermetically Sealed Negative Pressure Suit Area","desc":"German federal government premier biomedical research institute and pathogen reference laboratory"},{"id":"bio-vec","name":"State Research Center VECTOR (Koltsovo)","city":"Koltsovo","state":"Novosibirsk","country":"Russia","lat":54.938,"lon":83.228,"level":"BSL-4 MAXIMUM / MILITARY","agency":"Rospotrebnadzor","pathogens":"Variola virus (Smallpox official repository), Ebola, Marburg, Anthrax","airFiltration":"Multi-layer High Security Exhaust Air Filtration","desc":"One of two official global repositories of Smallpox; former major Soviet biological warfare research pillar"},{"id":"bio-spz","name":"Spiez Laboratory (Labor Spiez)","city":"Spiez","state":"Bern","country":"Switzerland","lat":46.687,"lon":7.662,"level":"BSL-4 / OPCW DESIGNATED","agency":"Federal Office for Civil Protection","pathogens":"Ebola, Marburg, Anthrax, Sarin, Novichok chemical agents","airFiltration":"Swiss Alpine Protected Containment","desc":"Switzerland national institute for NBC-protection; designated laboratory for OPCW chemical investigations"},{"id":"bio-wiv","name":"Wuhan Institute of Virology (Zhengdian)","city":"Wuhan","state":"Hubei","country":"China","lat":30.377,"lon":114.262,"level":"BSL-4 MAXIMUM","agency":"Chinese Academy of Sciences","pathogens":"Bat Coronaviruses (RaTG13), Ebola, Nipah, Crimean-Congo","airFiltration":"French-Engineered P4 Biosafety Systems","desc":"First operational BSL-4 laboratory in mainland China; central to global coronavirus origin investigations"},{"id":"bio-niv","name":"National Institute of Virology (NIV Pune)","city":"Pune","state":"Maharashtra","country":"India","lat":18.529,"lon":73.876,"level":"BSL-4 MAXIMUM","agency":"Indian Council of Medical Research (ICMR)","pathogens":"Nipah virus, Kyasanur Forest Disease, Crimean-Congo, SARS-CoV-2, Zika","airFiltration":"Bio-Bubble Negative Pressure Suite","desc":"India premier virology command center; successfully isolated Nipah virus and created indigenous Covaxin seed strain"},{"id":"bio-drd","name":"Defence R&D Establishment (DRDE Gwalior)","city":"Gwalior","state":"Madhya Pradesh","country":"India","lat":26.208,"lon":78.188,"level":"BSL-3+ / BSL-4 CBRN","agency":"Defence Research & Development Organisation (DRDO)","pathogens":"Anthrax, Botulinum toxin, Plague, Chemical nerve agents, Protective suits","airFiltration":"Military Chemical-Biological Scrubbers","desc":"India primary defense institution for protection against chemical and biological warfare weapons"},{"id":"bio-hsd","name":"ICAR-NIHSAD (High Security Animal Disease)","city":"Bhopal","state":"Madhya Pradesh","country":"India","lat":23.238,"lon":77.382,"level":"BSL-4 ANIMAL / ZOONOTIC","agency":"Indian Council of Agricultural Research","pathogens":"Avian Influenza H5N1, Foot-and-Mouth Disease, Exotic Zoonoses","airFiltration":"Biocontainment Negative HEPA System","desc":"India premier containment laboratory for catastrophic animal diseases and transboundary bio-threats"},{"id":"bio-acdp","name":"Australian Centre for Disease Preparedness","city":"Geelong","state":"VIC","country":"Australia","lat":-38.125,"lon":144.36,"level":"BSL-4 MAXIMUM","agency":"CSIRO","pathogens":"Hendra virus, Nipah, Lyssavirus, Ebola, Swine flu","airFiltration":"Highest Level Biosecurity Air Locks","desc":"Southern Hemisphere premier biosecurity defense lab for lethal zoonotic and emerging pandemics"}];
      const SEED_EXCLUSIONS = [{"id":"exc-che","name":"Chernobyl Exclusion Zone (Zone of Alienation)","city":"Pripyat","state":"Kyiv Oblast","country":"Ukraine","lat":51.389,"lon":30.099,"evacuated":"1986","hazard":"SEVERE NUCLEAR RADIATION","radLevel":"Up to 300 uSv/h (Red Forest)","desc":"2,600 sq km perimeter evacuated after Reactor No. 4 explosion; crumbling Soviet city overgrown by wildlife"},{"id":"exc-fuk","name":"Fukushima Daiichi Difficult-to-Return Zone","city":"Okuma & Futaba","state":"Fukushima","country":"Japan","lat":37.421,"lon":141.032,"evacuated":"2011","hazard":"NUCLEAR TRIPLE MELTDOWN","radLevel":"5 - 50 uSv/h","desc":"Barricaded radiation zone around ruined nuclear plant; abandoned stores, cars and radioactive topsoil bags"},{"id":"exc-cen","name":"Centralia Mine Fire Ghost Town","city":"Centralia","state":"PA","country":"USA","lat":40.803,"lon":-76.34,"evacuated":"1984","hazard":"UNDERGROUND ANTHRACITE FIRE","radLevel":"Carbon Monoxide / Ground Subsidence","desc":"Underground coal mine fire burning continuously since 1962; smoking cracks in Highway 61 and toxic gases"},{"id":"exc-pic","name":"Picher Toxic Superfund Ghost Town","city":"Picher","state":"OK","country":"USA","lat":36.983,"lon":-94.831,"evacuated":"2009","hazard":"LEAD & ZINC TOXICITY","radLevel":"Heavy Metal Poisoning / Mine Collapse","desc":"Former world capital of lead mining; mountainous chat piles, poisoned groundwater and collapsing mine shafts"},{"id":"exc-zrg","name":"Zone Rouge (Red Zone of Verdun)","city":"Verdun","state":"Meuse","country":"France","lat":49.208,"lon":5.412,"evacuated":"1918","hazard":"UNEXPLODED ORDNANCE & ARSENIC","radLevel":"Chemical Munitions / Gas Shells","desc":"100 sq km battlefield forever sealed; millions of unexploded WWI mustard gas shells and lethal arsenic saturation"},{"id":"exc-var","name":"Varosha Militarized Ghost City","city":"Famagusta","state":"Famagusta","country":"Cyprus","lat":35.116,"lon":33.953,"evacuated":"1974","hazard":"MILITARY BUFFER / MINES","radLevel":"None (Booby-trapped Buildings)","desc":"Luxury beach resort frozen in 1974 Turkish invasion; high-rise hotels decaying behind barbed-wire military fences"},{"id":"exc-has","name":"Hashima Island (Gunkanjima / Battleship Is.)","city":"Nagasaki","state":"Nagasaki","country":"Japan","lat":32.627,"lon":129.538,"evacuated":"1974","hazard":"STRUCTURAL COLLAPSE HAZARD","radLevel":"Extreme Ocean Weathering","desc":"Concrete coal-mining fortress island abandoned overnight in 1974; decaying sea-walls and eerie apartment ruins"},{"id":"exc-wit","name":"Wittenoom Asbestos Ghost Town","city":"Pilbara","state":"WA","country":"Australia","lat":-22.241,"lon":118.336,"evacuated":"2006 (Delisted)","hazard":"BLUE ASBESTOS CONTAMINATION","radLevel":"Lethal Crocidolite Dust","desc":"Erased from Australian maps; 3 million tonnes of blue asbestos tailings blown across the gorge and town"},{"id":"exc-pyr","name":"Pyramiden Soviet Arctic Ghost City","city":"Spitsbergen","state":"Svalbard","country":"Norway","lat":78.656,"lon":16.326,"evacuated":"1998","hazard":"ARCTIC DECAY / POLAR BEARS","radLevel":"Sub-Zero Preservation","desc":"Soviet coal-mining model town preserved in Arctic ice; grand cultural palace, bust of Lenin and grand piano intact"},{"id":"exc-kol","name":"Kolmanskop Desert Ghost Town","city":"Luderitz","state":"Karas","country":"Namibia","lat":-26.704,"lon":15.231,"evacuated":"1956","hazard":"DESERT DUNE INVASION","radLevel":"None","desc":"Opulent German diamond boomtown swallowed by Namib Desert sand dunes blowing through abandoned parlor doors"},{"id":"exc-dhn","name":"Dhanushkodi Cyclonic Ghost Town","city":"Rameswaram","state":"Tamil Nadu","country":"India","lat":9.177,"lon":79.417,"evacuated":"1964","hazard":"CYCLONE SUBMERGENCE / TIDE SURGE","radLevel":"High Tide Submergence","desc":"Thriving holy railway port town submerged by 20ft tidal wave in 1964; ruined church, railway station and customs house on the ocean edge"},{"id":"exc-kul","name":"Kuldhara Cursed Desert Ruins","city":"Jaisalmer","state":"Rajasthan","country":"India","lat":26.87,"lon":70.785,"evacuated":"1825","hazard":"DESERTION / FOLKLORE CURSE","radLevel":"Arid Extreme Exposure","desc":"Overnight abandoned Paliwal Brahmin village; 84 stone villages vacated in a single night to escape tyrannical Diwan Salim Singh"},{"id":"exc-lkh","name":"Lakhpat Fort Ghost City","city":"Lakhpat","state":"Gujarat","country":"India","lat":23.831,"lon":68.783,"evacuated":"1819 Earthquake","hazard":"RIVER DIVERSION ARIDITY","radLevel":"Hypersaline Soil","desc":"Massive 7km stone fort at the edge of Rann of Kutch; lost its Indus river commerce after 1819 quake and stands nearly deserted"},{"id":"exc-ros","name":"Ross Island Penal Colony Ruins","city":"Port Blair","state":"Andaman and Nicobar","country":"India","lat":11.674,"lon":92.762,"evacuated":"1941 Quake & WWII","hazard":"JUNGLE STRANGLER FIG COLLAPSE","radLevel":"None","desc":"Headquarters of British penal settlement abandoned after 1941 earthquake; colonial ballroom and hospital choked by massive ficus tree roots"}];

      let _viewer = null;
      let _barsPrimitives = null;
      let _armoryPrimitives = null;
      let _threatPrimitives = null;
      let _prisonsPrimitives = null;
      let _bunkersPrimitives = null;
      let _biolabsPrimitives = null;
      let _exclusionsPrimitives = null;
      let _prisonsEnabled = false;
      let _bunkersEnabled = false;
      let _biolabsEnabled = false;
      let _exclusionsEnabled = false;

      let _threatEntities = [];
      let _barsEnabled = false;
      let _armoryEnabled = false;
      let _threatEnabled = false;
      let _activeDebounce = null;
      let _searchTimer = null;

      function injectStyles() {
        if (document.getElementById('blackzone-styles')) return;
        const style = document.createElement('style');
        style.id = 'blackzone-styles';
        style.textContent = `
          .blackzone-divider {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 18px 0 10px 0;
            padding: 0 4px;
            user-select: none;
          }
          .blackzone-divider .bz-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, rgba(239, 68, 68, 0.7), rgba(217, 70, 239, 0.5), transparent);
          }
          .blackzone-divider .bz-title {
            font-family: 'JetBrains Mono', 'SF Mono', monospace;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #ff3366;
            text-shadow: 0 0 10px rgba(255, 51, 102, 0.7);
            text-transform: uppercase;
          }
          .bz-row {
            border-left: 2px solid transparent;
            transition: border-color 0.2s, background 0.2s;
          }
          .bz-row[data-layer-id="bz-bars"].active-bz {
            border-left-color: #d946ef;
            background: rgba(217, 70, 239, 0.10);
          }
          .bz-row[data-layer-id="bz-armory"].active-bz {
            border-left-color: #f97316;
            background: rgba(249, 115, 22, 0.10);
          }
          
          .bz-row[data-layer-id="bz-prisons"].active-bz {
            border-left-color: #94a3b8;
            background: rgba(148, 163, 184, 0.12);
          }
          .bz-row[data-layer-id="bz-bunkers"].active-bz {
            border-left-color: #00f0ff;
            background: rgba(0, 240, 255, 0.12);
          }
          .bz-row[data-layer-id="bz-biolabs"].active-bz {
            border-left-color: #eab308;
            background: rgba(234, 179, 8, 0.12);
          }
          .bz-row[data-layer-id="bz-exclusions"].active-bz {
            border-left-color: #10b981;
            background: rgba(16, 185, 129, 0.12);
          }

          .bz-row[data-layer-id="bz-threat"].active-bz {
            border-left-color: #ef4444;
            background: rgba(239, 68, 68, 0.15);
          }
          .bz-tooltip {
            position: fixed;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(8, 12, 20, 0.96);
            border: 1px solid #ff3366;
            box-shadow: 0 0 24px rgba(255, 51, 102, 0.45);
            padding: 10px 18px;
            border-radius: 6px;
            color: #fff;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            z-index: 99999;
            pointer-events: none;
            display: none;
            max-width: 90vw;
            backdrop-filter: blur(8px);
          }
        `;
        document.head.appendChild(style);
      }

      function getCameraBounds(viewer) {
        if (!viewer?.camera) return null;
        try {
          const rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
          if (!rect) return null;
          return {
            south: Cesium.Math.toDegrees(rect.south),
            west: Cesium.Math.toDegrees(rect.west),
            north: Cesium.Math.toDegrees(rect.north),
            east: Cesium.Math.toDegrees(rect.east),
            altitude: Math.round(viewer.camera.positionCartographic?.height || 50000)
          };
        } catch (e) { return null; }
      }

      async function fetchOverpassNodes(query) {
        try {
          const res = await fetch('/api/overpass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'data=' + encodeURIComponent(query),
            signal: AbortSignal.timeout(12000)
          });
          if (!res.ok) return [];
          const json = await res.json();
          return Array.isArray(json?.elements) ? json.elements : [];
        } catch { return []; }
      }

      function resolveViewer() {
        if (_viewer && !_viewer.isDestroyed?.()) return _viewer;
        if (window.__godsEyeView?.viewer && !window.__godsEyeView.viewer.isDestroyed?.()) {
          _viewer = window.__godsEyeView.viewer;
          return _viewer;
        }
        if (window.gevViewer && !window.gevViewer.isDestroyed?.()) {
          _viewer = window.gevViewer;
          return _viewer;
        }
        try {
          const c = document.getElementById('cesiumContainer');
          if (c?._cesiumWidget?.viewer) {
            _viewer = c._cesiumWidget.viewer;
            return _viewer;
          }
          if (c?.cesiumWidget?.viewer) {
            _viewer = c.cesiumWidget.viewer;
            return _viewer;
          }
        } catch (_) {}
        return null;
      }

      function ensureBarsPrimitives(viewer) {
        if (!_barsPrimitives || _barsPrimitives.isDestroyed?.()) {
          _barsPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
        return _barsPrimitives;
      }

      function ensureArmoryPrimitives(viewer) {
        if (!_armoryPrimitives || _armoryPrimitives.isDestroyed?.()) {
          _armoryPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
        return _armoryPrimitives;
      }

      
      function ensurePrisonsPrimitives(viewer) {
        if (!_prisonsPrimitives || _prisonsPrimitives.isDestroyed?.()) {
          _prisonsPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
        return _prisonsPrimitives;
      }
      function ensureBunkersPrimitives(viewer) {
        if (!_bunkersPrimitives || _bunkersPrimitives.isDestroyed?.()) {
          _bunkersPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
        return _bunkersPrimitives;
      }
      function ensureBiolabsPrimitives(viewer) {
        if (!_biolabsPrimitives || _biolabsPrimitives.isDestroyed?.()) {
          _biolabsPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
        return _biolabsPrimitives;
      }
      function ensureExclusionsPrimitives(viewer) {
        if (!_exclusionsPrimitives || _exclusionsPrimitives.isDestroyed?.()) {
          _exclusionsPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
        return _exclusionsPrimitives;
      }

      function ensureThreatPrimitives(viewer) {
        if (!_threatPrimitives || _threatPrimitives.isDestroyed?.()) {
          _threatPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
        return _threatPrimitives;
      }

      /* ─── 1. BARS LAYER ─── */
      async function renderBars(viewer) {
        if (!_barsEnabled || !viewer) return;
        const col = ensureBarsPrimitives(viewer);
        col.removeAll();

        const magenta = Cesium.Color.fromCssColorString('#d946ef');
        const violet = Cesium.Color.fromCssColorString('#a855f7');

        // Always plot all pre-seeded global nightlife hubs
        for (const s of SEED_BARS) {
          const isClub = s.type === 'nightclub';
          col.add({
            position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 100),
            color: isClub ? magenta : violet,
            pixelSize: isClub ? 11 : 9,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'BAR / NIGHTLIFE',
              name: s.name,
              meta: (s.city || '') + ', ' + (s.state ? s.state + ', ' : '') + s.country,
              kind: (s.type || 'bar').toUpperCase(),
              lat: s.lat,
              lon: s.lon
            }
          });
        }

        updateToggleCount('bz-bars', String(SEED_BARS.length) + ' HUBS');
        viewer.scene.requestRender?.();

        // If zoomed in close (< 15km), also query live Overpass
        const b = getCameraBounds(viewer);
        if (!b || b.altitude > 35000) return;

        updateToggleCount('bz-bars', String(SEED_BARS.length) + '+SCAN');
        const query = '[out:json][timeout:15];(' +
          'nwr["amenity"~"bar|pub|nightclub|biergarten|lounge"](' + b.south.toFixed(4) + ',' + b.west.toFixed(4) + ',' + b.north.toFixed(4) + ',' + b.east.toFixed(4) + ');' +
          'nwr["shop"~"alcohol|beverages|wine|beer|liquor"](' + b.south.toFixed(4) + ',' + b.west.toFixed(4) + ',' + b.north.toFixed(4) + ',' + b.east.toFixed(4) + ');' +
          ');out center 250;';

        const nodes = await fetchOverpassNodes(query);
        if (!_barsEnabled) return;

        let liveCount = 0;
        for (const n of nodes) {
          const lat = Number.isFinite(n.lat) ? n.lat : n.center?.lat;
          const lon = Number.isFinite(n.lon) ? n.lon : n.center?.lon;
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
          const isClub = n.tags?.amenity === 'nightclub';
          const name = n.tags?.name || (isClub ? 'Nightclub' : 'Bar/Pub');
          col.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 10),
            color: isClub ? magenta : violet,
            pixelSize: isClub ? 8 : 7,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'LOCAL NIGHTLIFE',
              name: name,
              meta: n.tags?.['addr:street'] || 'Local venue',
              kind: (isClub ? 'Club' : 'Bar'),
              lat, lon
            }
          });
          liveCount++;
        }

        updateToggleCount('bz-bars', String(SEED_BARS.length + liveCount));
        viewer.scene.requestRender?.();
      }

      /* ─── 2. ARMORY LAYER ─── */
      async function renderArmory(viewer) {
        if (!_armoryEnabled || !viewer) return;
        const col = ensureArmoryPrimitives(viewer);
        col.removeAll();

        const amber = Cesium.Color.fromCssColorString('#f97316');
        const rangeGreen = Cesium.Color.fromCssColorString('#22c55e');

        for (const s of SEED_ARMORY) {
          const isRange = s.type === 'shooting_range';
          col.add({
            position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 100),
            color: isRange ? rangeGreen : amber,
            pixelSize: 10,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'ARMORY & FIREARMS',
              name: s.name,
              meta: (s.city || '') + ', ' + (s.state ? s.state + ', ' : '') + s.country,
              desc: s.desc || '',
              kind: (s.type || 'armory').toUpperCase(),
              lat: s.lat,
              lon: s.lon
            }
          });
        }

        updateToggleCount('bz-armory', String(SEED_ARMORY.length) + ' ARMS');
        viewer.scene.requestRender?.();

        const b = getCameraBounds(viewer);
        if (!b || b.altitude > 30000) return;

        updateToggleCount('bz-armory', String(SEED_ARMORY.length) + '+SCAN');
        const query = '[out:json][timeout:15];(' +
          'nwr["shop"~"weapons|hunting|guns|ammunition"](' + b.south.toFixed(4) + ',' + b.west.toFixed(4) + ',' + b.north.toFixed(4) + ',' + b.east.toFixed(4) + ');' +
          'nwr["amenity"~"shooting_range"](' + b.south.toFixed(4) + ',' + b.west.toFixed(4) + ',' + b.north.toFixed(4) + ',' + b.east.toFixed(4) + ');' +
          ');out center 180;';

        const nodes = await fetchOverpassNodes(query);
        if (!_armoryEnabled) return;

        let liveCount = 0;
        for (const n of nodes) {
          const lat = Number.isFinite(n.lat) ? n.lat : n.center?.lat;
          const lon = Number.isFinite(n.lon) ? n.lon : n.center?.lon;
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
          const isRange = n.tags?.amenity === 'shooting_range';
          const name = n.tags?.name || (isRange ? 'Shooting Range' : 'Firearms & Tactical');
          col.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 10),
            color: isRange ? rangeGreen : amber,
            pixelSize: 8,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'LOCAL FIREARMS',
              name: name,
              meta: n.tags?.['addr:street'] || 'Gun Shop / Range',
              kind: (isRange ? 'Shooting Range' : 'Gun Shop'),
              lat, lon
            }
          });
          liveCount++;
        }

        updateToggleCount('bz-armory', String(SEED_ARMORY.length + liveCount));
        viewer.scene.requestRender?.();
      }

      /* ─── 3. HIGH-THREAT / HOMICIDE ZONES LAYER ─── */
      function renderThreatZones(viewer, enable) {
        _threatEnabled = enable;
        if (!viewer) return;

        // Cleanup
        if (_threatPrimitives) {
          _threatPrimitives.removeAll();
        }
        _threatEntities.forEach(e => {
          try { viewer.entities.remove(e); } catch (_) {}
        });
        _threatEntities = [];

        if (!enable) {
          updateToggleCount('bz-threat', 'OFF');
          viewer.scene.requestRender?.();
          return;
        }

        const prims = ensureThreatPrimitives(viewer);
        prims.removeAll();

        const redColor = Cesium.Color.fromCssColorString('#ff1744');
        const orangeColor = Cesium.Color.fromCssColorString('#ff9100');
        const yellowColor = Cesium.Color.fromCssColorString('#ffd600');

        THREAT_HOTSPOTS.forEach(spot => {
          const isCrit = spot.tier === 'CRITICAL';
          const isHigh = spot.tier === 'HIGH';
          const dotColor = isCrit ? redColor : (isHigh ? orangeColor : yellowColor);

          // 1. PointPrimitive: ALWAYS visible on globe from space to ground
          prims.add({
            position: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 200),
            color: dotColor,
            pixelSize: isCrit ? 13 : 10,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'HIGH-THREAT ZONE',
              name: spot.name,
              meta: spot.country + (spot.state ? ' (' + spot.state + ')' : ''),
              tier: spot.tier,
              rate: spot.rate,
              desc: spot.desc,
              lat: spot.lat,
              lon: spot.lon
            }
          });

          // 2. Entity Ellipse Zone: tactical perimeter
          const radiusMeters = 35000;
          const ellipseEntity = viewer.entities.add({
            id: 'bz-threat-area-' + spot.id,
            name: spot.name,
            position: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 0),
            ellipse: {
              semiMinorAxis: radiusMeters,
              semiMajorAxis: radiusMeters,
              material: dotColor.withAlpha(0.20),
              outline: true,
              outlineColor: dotColor,
              outlineWidth: 2.0,
              height: 0
            }
          });

          // 3. Entity Label: visible from space (up to 45,000 km)
          const labelEntity = viewer.entities.add({
            id: 'bz-threat-lbl-' + spot.id,
            position: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 1000),
            label: {
              text: '⚠ ' + spot.name + ' [' + spot.rate + '/100k]',
              font: 'bold 11px JetBrains Mono, monospace',
              fillColor: dotColor,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -16),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 48000000)
            }
          });

          _threatEntities.push(ellipseEntity, labelEntity);
        });

        updateToggleCount('bz-threat', String(THREAT_HOTSPOTS.length) + ' ZONES');
        viewer.scene.requestRender?.();
      }

      /* ─── 4. SUPERMAX PRISONS LAYER ─── */
      function renderPrisons(viewer, enable) {
        _prisonsEnabled = enable;
        if (!viewer) return;
        if (!_prisonsPrimitives) ensurePrisonsPrimitives(viewer);
        _prisonsPrimitives.removeAll();

        if (!enable) {
          updateToggleCount('bz-prisons', 'OFF');
          viewer.scene.requestRender?.();
          return;
        }

        const slateColor = Cesium.Color.fromCssColorString('#94a3b8');
        const prims = ensurePrisonsPrimitives(viewer);

        SEED_PRISONS.forEach(p => {
          prims.add({
            position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 150),
            color: slateColor,
            pixelSize: 11,
            outlineColor: Cesium.Color.fromCssColorString('#0f172a'),
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'SUPERMAX PRISON',
              name: p.name,
              meta: (p.city ? p.city + ', ' : '') + (p.state ? p.state + ', ' : '') + p.country,
              security: p.security,
              capacity: p.capacity,
              escapeRisk: p.escapeRisk,
              inmates: p.inmates,
              desc: p.desc,
              lat: p.lat,
              lon: p.lon
            }
          });
        });

        updateToggleCount('bz-prisons', String(SEED_PRISONS.length) + ' PRISONS');
        viewer.scene.requestRender?.();
      }

      /* ─── 5. NUCLEAR BUNKERS LAYER ─── */
      function renderBunkers(viewer, enable) {
        _bunkersEnabled = enable;
        if (!viewer) return;
        if (!_bunkersPrimitives) ensureBunkersPrimitives(viewer);
        _bunkersPrimitives.removeAll();

        if (!enable) {
          updateToggleCount('bz-bunkers', 'OFF');
          viewer.scene.requestRender?.();
          return;
        }

        const cyanColor = Cesium.Color.fromCssColorString('#00f0ff');
        const prims = ensureBunkersPrimitives(viewer);

        SEED_BUNKERS.forEach(b => {
          prims.add({
            position: Cesium.Cartesian3.fromDegrees(b.lon, b.lat, 200),
            color: cyanColor,
            pixelSize: 12,
            outlineColor: Cesium.Color.fromCssColorString('#003366'),
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'NUCLEAR BUNKER & COG',
              name: b.name,
              meta: (b.city ? b.city + ', ' : '') + (b.state ? b.state + ', ' : '') + b.country,
              depthMeters: b.depthMeters,
              blastResistance: b.blastResistance,
              capacity: b.capacity,
              status: b.status,
              desc: b.desc,
              lat: b.lat,
              lon: b.lon
            }
          });
        });

        updateToggleCount('bz-bunkers', String(SEED_BUNKERS.length) + ' BUNKERS');
        viewer.scene.requestRender?.();
      }

      /* ─── 6. BSL-4 VIROLOGY LABS LAYER ─── */
      function renderBiolabs(viewer, enable) {
        _biolabsEnabled = enable;
        if (!viewer) return;
        if (!_biolabsPrimitives) ensureBiolabsPrimitives(viewer);
        _biolabsPrimitives.removeAll();

        if (!enable) {
          updateToggleCount('bz-biolabs', 'OFF');
          viewer.scene.requestRender?.();
          return;
        }

        const yellowColor = Cesium.Color.fromCssColorString('#eab308');
        const prims = ensureBiolabsPrimitives(viewer);

        SEED_BIOLABS.forEach(b => {
          prims.add({
            position: Cesium.Cartesian3.fromDegrees(b.lon, b.lat, 180),
            color: yellowColor,
            pixelSize: 12,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'BSL-4 BIO-DEFENSE LAB',
              name: b.name,
              meta: (b.city ? b.city + ', ' : '') + (b.state ? b.state + ', ' : '') + b.country,
              level: b.level,
              agency: b.agency,
              pathogens: b.pathogens,
              airFiltration: b.airFiltration,
              desc: b.desc,
              lat: b.lat,
              lon: b.lon
            }
          });
        });

        updateToggleCount('bz-biolabs', String(SEED_BIOLABS.length) + ' BSL-4');
        viewer.scene.requestRender?.();
      }

      /* ─── 7. EXCLUSION ZONES & GHOST TOWNS ─── */
      function renderExclusions(viewer, enable) {
        _exclusionsEnabled = enable;
        if (!viewer) return;
        if (!_exclusionsPrimitives) ensureExclusionsPrimitives(viewer);
        _exclusionsPrimitives.removeAll();

        if (!enable) {
          updateToggleCount('bz-exclusions', 'OFF');
          viewer.scene.requestRender?.();
          return;
        }

        const emeraldColor = Cesium.Color.fromCssColorString('#10b981');
        const prims = ensureExclusionsPrimitives(viewer);

        SEED_EXCLUSIONS.forEach(e => {
          prims.add({
            position: Cesium.Cartesian3.fromDegrees(e.lon, e.lat, 150),
            color: emeraldColor,
            pixelSize: 11,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            id: {
              category: 'EXCLUSION ZONE / GHOST TOWN',
              name: e.name,
              meta: (e.city ? e.city + ', ' : '') + (e.state ? e.state + ', ' : '') + e.country,
              evacuated: e.evacuated,
              hazard: e.hazard,
              radLevel: e.radLevel,
              desc: e.desc,
              lat: e.lat,
              lon: e.lon
            }
          });
        });

        updateToggleCount('bz-exclusions', String(SEED_EXCLUSIONS.length) + ' ZONES');
        viewer.scene.requestRender?.();
      }


      function updateToggleCount(layerId, text) {
        const row = document.querySelector('.bz-row[data-layer-id="' + layerId + '"]');
        if (row) {
          const el = row.querySelector('.data-count');
          if (el) el.textContent = text;
        }
      }

      function onCameraMove() {
        const v = resolveViewer();
        if (!v) return;
        clearTimeout(_activeDebounce);
        _activeDebounce = setTimeout(() => {
          if (_barsEnabled) renderBars(v);
          if (_armoryEnabled) renderArmory(v);
        }, 500);
      }

      function createToggleRow(id, icon, name, initialCount) {
        const row = document.createElement('div');
        row.className = 'data-toggle-row bz-row';
        row.dataset.layerId = id;

        const top = document.createElement('div');
        top.className = 'data-toggle-top';

        const left = document.createElement('div');
        left.className = 'data-toggle-left';
        left.innerHTML = '<span class="data-icon">' + icon + '</span><span class="data-name">' + name + '</span>';

        const right = document.createElement('div');
        right.className = 'data-toggle-right';

        const count = document.createElement('span');
        count.className = 'data-count';
        count.textContent = initialCount || 'OFF';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'data-toggle-btn';
        btn.textContent = 'OFF';

        btn.addEventListener('click', () => {
          const isNowActive = !btn.classList.contains('active');
          btn.classList.toggle('active', isNowActive);
          row.classList.toggle('active-bz', isNowActive);
          btn.textContent = isNowActive ? 'ON' : 'OFF';

          const v = resolveViewer();

          if (id === 'bz-bars') {
            _barsEnabled = isNowActive;
            if (!isNowActive && _barsPrimitives) {
              try { _barsPrimitives.removeAll(); } catch (_) {}
              count.textContent = 'OFF';
            }
            if (isNowActive) {
              if (v) renderBars(v);
              else count.textContent = 'CONNECTING...';
            }
          } else if (id === 'bz-armory') {
            _armoryEnabled = isNowActive;
            if (!isNowActive && _armoryPrimitives) {
              try { _armoryPrimitives.removeAll(); } catch (_) {}
              count.textContent = 'OFF';
            }
            if (isNowActive) {
              if (v) renderArmory(v);
              else count.textContent = 'CONNECTING...';
            }
          } else if (id === 'bz-prisons') {
            _prisonsEnabled = isNowActive;
            if (v) renderPrisons(v, isNowActive);
            else if (isNowActive) count.textContent = 'CONNECTING...';
            else count.textContent = 'OFF';
          } else if (id === 'bz-bunkers') {
            _bunkersEnabled = isNowActive;
            if (v) renderBunkers(v, isNowActive);
            else if (isNowActive) count.textContent = 'CONNECTING...';
            else count.textContent = 'OFF';
          } else if (id === 'bz-biolabs') {
            _biolabsEnabled = isNowActive;
            if (v) renderBiolabs(v, isNowActive);
            else if (isNowActive) count.textContent = 'CONNECTING...';
            else count.textContent = 'OFF';
          } else if (id === 'bz-exclusions') {
            _exclusionsEnabled = isNowActive;
            if (v) renderExclusions(v, isNowActive);
            else if (isNowActive) count.textContent = 'CONNECTING...';
            else count.textContent = 'OFF';
          } else if (id === 'bz-threat') {
            _threatEnabled = isNowActive;
            if (v) renderThreatZones(v, isNowActive);
            else if (isNowActive) count.textContent = 'CONNECTING...';
            else count.textContent = 'OFF';
          }
        });

        right.appendChild(count);
        right.appendChild(btn);
        top.appendChild(left);
        top.appendChild(right);
        row.appendChild(top);
        return row;
      }

      let _bzElements = null;
      function getOrCreateBzElements() {
        if (_bzElements) return _bzElements;
        injectStyles();

        const divider = document.createElement('div');
        divider.id = 'bz-divider';
        divider.className = 'blackzone-divider';
        divider.innerHTML = `
          <div class="bz-line"></div>
          <span class="bz-title">&#x25BC; BLACK ZONE (TACTICAL INTEL)</span>
          <div class="bz-line"></div>
        `;

        const barsRow = createToggleRow('bz-bars', '&#x1F378;', 'Nightlife &amp; Bars');
        const armoryRow = createToggleRow('bz-armory', '&#x1F3AF;', 'Tactical &amp; Armory');
        const threatRow = createToggleRow('bz-threat', '&#x2623;&#xFE0F;', 'High-Threat Zones');
        const prisonsRow = createToggleRow('bz-prisons', '&#x26D3;&#xFE0F;', 'Supermax Prisons');
        const bunkersRow = createToggleRow('bz-bunkers', '&#x26A1;', 'Nuclear Bunkers');
        const biolabsRow = createToggleRow('bz-biolabs', '&#x2622;&#xFE0F;', 'BSL-4 Bio Labs');
        const exclusionsRow = createToggleRow('bz-exclusions', '&#x1F47B;', 'Exclusion Zones');

        _bzElements = [divider, barsRow, armoryRow, threatRow, prisonsRow, bunkersRow, biolabsRow, exclusionsRow];
        return _bzElements;
      }

      function ensureMounted() {
        const list = document.getElementById('data-toggles');
        if (!list) return;
        if (!list.contains(document.getElementById('bz-divider'))) {
          const els = getOrCreateBzElements();
          els.forEach(el => list.appendChild(el));
        }
      }

      function setupBlackZoneObserver() {
        const list = document.getElementById('data-toggles');
        if (!list) {
          setTimeout(setupBlackZoneObserver, 150);
          return;
        }
        ensureMounted();
        const obs = new MutationObserver(() => ensureMounted());
        obs.observe(list, { childList: true });
        setInterval(ensureMounted, 1000);
      }

      function setupHoverTooltip(viewer) {
        if (!viewer?.scene?.canvas) return;
        if (document.getElementById('bz-tooltip-installed')) return;

        let tip = document.getElementById('bz-tooltip');
        if (!tip) {
          tip = document.createElement('div');
          tip.id = 'bz-tooltip';
          tip.className = 'bz-tooltip';
          document.body.appendChild(tip);
        }

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(movement => {
          try {
            const picked = viewer.scene.pick(movement.endPosition);
            if (picked?.primitive?.id && typeof picked.primitive.id === 'object') {
              const d = picked.primitive.id;
              tip.style.display = 'block';
              let body = '';
              const cat = d.category || 'INTEL';

              if (cat === 'SUPERMAX PRISON') {
                body = '<strong style="color:#94a3b8">&#x26D3;&#xFE0F; [SUPERMAX PRISON] ' + d.name + '</strong>';
                if (d.meta) body += '<br><span style="color:#cbd5e1">' + d.meta + '</span>';
                if (d.security) body += ' &bull; <strong style="color:#f87171">TIER: ' + d.security + '</strong>';
                if (d.capacity) body += '<br><small style="color:#aaa">CAPACITY: ' + d.capacity + ' | ESCAPE RISK: <span style="color:#fbbf24">' + d.escapeRisk + '</span></small>';
                if (d.inmates) body += '<br><small style="color:#e2e8f0"><strong>NOTABLE INMATES:</strong> ' + d.inmates + '</small>';
                if (d.desc) body += '<br><small style="color:#94a3b8">' + d.desc + '</small>';
              } else if (cat === 'NUCLEAR BUNKER & COG') {
                body = '<strong style="color:#00f0ff">&#x26A1; [NUCLEAR COG BUNKER] ' + d.name + '</strong>';
                if (d.meta) body += '<br><span style="color:#67e8f9">' + d.meta + '</span>';
                if (d.depthMeters) body += ' &bull; <strong style="color:#a5f3fc">DEPTH: ' + d.depthMeters + 'm</strong>';
                if (d.blastResistance) body += '<br><small style="color:#aaa">HARDENING: <span style="color:#fde047">' + d.blastResistance + '</span> | STATUS: ' + d.status + '</small>';
                if (d.desc) body += '<br><small style="color:#94a3b8">' + d.desc + '</small>';
              } else if (cat === 'BSL-4 BIO-DEFENSE LAB') {
                body = '<strong style="color:#eab308">&#x2622;&#xFE0F; [BIO-DEFENSE BSL-4] ' + d.name + '</strong>';
                if (d.meta) body += '<br><span style="color:#fef08a">' + d.meta + '</span>';
                if (d.agency) body += ' &bull; <small style="color:#cbd5e1">' + d.agency + '</small>';
                if (d.pathogens) body += '<br><small style="color:#f87171"><strong>PATHOGENS:</strong> ' + d.pathogens + '</small>';
                if (d.airFiltration) body += '<br><small style="color:#aaa">CONTAINMENT: ' + d.airFiltration + '</small>';
                if (d.desc) body += '<br><small style="color:#94a3b8">' + d.desc + '</small>';
              } else if (cat === 'EXCLUSION ZONE / GHOST TOWN') {
                body = '<strong style="color:#10b981">&#x1F47B; [EXCLUSION ZONE] ' + d.name + '</strong>';
                if (d.meta) body += '<br><span style="color:#a7f3d0">' + d.meta + '</span>';
                if (d.hazard) body += ' &bull; <strong style="color:#f87171">' + d.hazard + '</strong>';
                if (d.evacuated) body += '<br><small style="color:#aaa">EVACUATED: ' + d.evacuated + (d.radLevel ? ' | TOXICITY: <span style="color:#fbbf24">' + d.radLevel + '</span>' : '') + '</small>';
                if (d.desc) body += '<br><small style="color:#94a3b8">' + d.desc + '</small>';
              } else {
                body = '<strong>[' + cat + '] ' + d.name + '</strong>';
                if (d.meta) body += '<br><span style="color:#ff6688">' + d.meta + '</span>';
                if (d.rate) body += ' &bull; <strong>Homicide: ' + d.rate + '/100k</strong> (' + d.tier + ')';
                if (d.desc) body += '<br><small style="color:#ccc">' + d.desc + '</small>';
              }

              body += '<br><small style="color:#64748b">COORDS: ' + d.lat.toFixed(4) + ', ' + d.lon.toFixed(4) + '</small>';
              tip.innerHTML = body;
            } else {
              tip.style.display = 'none';
            }
          } catch (_) {}
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        const flag = document.createElement('span');
        flag.id = 'bz-tooltip-installed';
        flag.style.display = 'none';
        document.body.appendChild(flag);
      }

      function onViewerFound(viewer) {
        if (!viewer) return;
        _viewer = viewer;
        console.log('[BlackZone] Hooked Cesium Viewer successfully.');

        try {
          viewer.camera.moveEnd.addEventListener(onCameraMove);
        } catch (_) {}

        setupHoverTooltip(viewer);

        // If user already clicked toggles, activate them right away
        if (_barsEnabled) renderBars(viewer);
        if (_armoryEnabled) renderArmory(viewer);
        if (_threatEnabled) renderThreatZones(viewer, true);
        if (_prisonsEnabled) renderPrisons(viewer, true);
        if (_bunkersEnabled) renderBunkers(viewer, true);
        if (_biolabsEnabled) renderBiolabs(viewer, true);
        if (_exclusionsEnabled) renderExclusions(viewer, true);
      }

      function pollForViewer() {
        const v = resolveViewer();
        if (v) {
          if (_searchTimer) { clearInterval(_searchTimer); _searchTimer = null; }
          onViewerFound(v);
        }
      }

      // Start UI mounting
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setupBlackZoneObserver();
          pollForViewer();
        });
      } else {
        setupBlackZoneObserver();
        pollForViewer();
      }

      // External callback hooks
      window.__onViewerReady = onViewerFound;

      // Fast poller
      _searchTimer = setInterval(pollForViewer, 250);
      setTimeout(() => {
        if (_searchTimer) { clearInterval(_searchTimer); _searchTimer = null; }
      }, 60000);

    })();