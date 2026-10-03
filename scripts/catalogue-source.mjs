/*
  SOURCE UNIQUE DU CATALOGUE MACHE.

  Trois niveaux : rayon, sous-rayon, type d'article. Ce fichier est la
  seule chose à modifier ; `node scripts/generate-categories.mjs` en
  tire les deux listes réellement utilisées (site et backend), que
  tests/rayons-backend.test.mts compare.

  Forme : [libellé, [enfants...]] ; un enfant est « libellé » ou
  [libellé, [petits-enfants]]. Les adresses (slugs) sont déduites du
  libellé ; LEGACY fige celles qui existaient déjà, pour ne casser ni
  un lien ni un produit.
*/

export const LEGACY = {
  "Mode": "mode", "Beauté": "beaute", "Maison": "maison", "Saveurs": "saveurs", "Artisanat": "artisanat",
  "Fait à la main": "fait-a-la-main", "Fait maison": "fait-maison", "Bio et naturel": "bio",
  "Électronique": "electronique", "Loisirs": "loisirs", "Bébé": "bebe", "Automobile": "automobile",
  "Animaux": "animaux", "Industrie et professionnels": "industrie-pro", "Bureau et scolaire": "bureau-scolaire", "Services": "services",
  "Vêtements femme": "vetements-femme", "Vêtements homme": "vetements-homme", "Mode enfant": "mode-enfant",
  "Chaussures femme": "chaussures-femme", "Chaussures homme": "chaussures-homme",
  "Chaussures enfant": "chaussures-enfant", "Lingerie et pyjamas": "lingerie-pyjamas",
  "Sacs et bagages": "sacs-bagages", "Bijoux et accessoires": "bijoux-accessoires",
  "Beauté et santé": "beaute-sante", "Maison et cuisine": "maison-cuisine", "Meubles": "meubles",
  "Électroménagers": "electromenagers", "Outillage et amélioration de l'habitat": "outillage-habitat",
  "Alimentation et épicerie": "alimentation-epicerie", "Arts, artisanat et couture": "arts-artisanat-couture",
  "Crochet et tricot": "crochet-tricot", "Tableaux et peintures": "tableaux-peintures",
  "Vannerie et paille": "vannerie-paille", "Bois et sculpture": "bois-sculpture",
  "Couture et broderie": "couture-brodee", "Bijoux faits main": "bijoux-faits-main",
  "Confitures et conserves": "confitures-conserves", "Pâtisserie maison": "patisserie-maison",
  "Épices et sauces": "epices-sauces", "Boissons maison": "boissons-maison",
  "Savons et cosmétiques maison": "savons-cosmetiques-maison", "Produits bio": "produits-bio",
  "Huiles et plantes": "huiles-essentielles", "Soins naturels": "soins-naturels",
  "Téléphones et accessoires": "telephones-accessoires", "Électroniques": "electroniques",
  "Jouets et jeux": "jouets-jeux", "Sports et activités d'extérieur": "sports-plein-air",
  "Livres et médias": "livres-medias", "Bébé et maternité": "bebe-maternite",
  "Accessoires animaux": "accessoires-animaux",
};

export const ICONS = {
  mode: "👕", beaute: "🌺", maison: "🏠", saveurs: "🍲", artisanat: "🎨", "fait-a-la-main": "🧶",
  "fait-maison": "🏡", bio: "🌱", electronique: "📱", loisirs: "🎲", bebe: "🍼", automobile: "🚗",
  animaux: "🐾", "industrie-pro": "🏭", "bureau-scolaire": "✏️", services: "🛠️",
};

export const SOURCE = [
  ["Mode", [
    ["Vêtements femme", [
      "Manteaux femme", "Vestes femme", "Blousons femme", "Doudounes femme", "Gilets et cardigans femme",
      "Pulls femme", "Sweats femme", "T-shirts femme", "Tops et débardeurs femme", "Chemises femme",
      "Blouses femme", "Robes", "Robes de soirée", "Robes de mariée", "Robes de cérémonie", "Jupes",
      "Pantalons femme", "Jeans femme", "Leggings", "Shorts femme", "Combinaisons et salopettes",
      "Ensembles femme", "Tailleurs et costumes femme", "Vêtements de sport femme", "Maillots de bain femme",
      "Paréos et tenues de plage", "Vêtements de grossesse", "Tenues traditionnelles femme",
      "Uniformes et tenues de travail femme", "Grandes tailles femme", "Foulards et châles",
    ]],
    ["Vêtements homme", [
      "Manteaux homme", "Vestes homme", "Blousons homme", "Doudounes homme", "Gilets homme", "Pulls homme",
      "Sweats homme", "T-shirts homme", "Polos homme", "Chemises homme", "Guayaberas et chemises légères",
      "Pantalons homme", "Jeans homme", "Shorts et bermudas homme", "Joggings homme", "Costumes homme",
      "Vestes de costume", "Cravates et noeuds papillon", "Vêtements de sport homme", "Maillots de bain homme",
      "Sous-vêtements homme", "Chaussettes homme", "Tenues traditionnelles homme",
      "Uniformes et tenues de travail homme", "Grandes tailles homme",
    ]],
    ["Mode enfant", [
      "Vêtements fille", "Vêtements garçon", "Robes fille", "T-shirts enfant", "Pantalons et jeans enfant",
      "Shorts enfant", "Ensembles enfant", "Manteaux enfant", "Uniformes scolaires", "Maillots de bain enfant",
      "Vêtements de nuit enfant", "Tenues de cérémonie enfant", "Tenues de baptême",
    ]],
    ["Chaussures femme", [
      "Baskets femme", "Sandales femme", "Tongs et claquettes femme", "Escarpins", "Talons compensés",
      "Ballerines", "Mocassins femme", "Bottes et bottines femme", "Chaussures de sport femme",
      "Chaussures de mariage femme", "Chaussures confort femme",
    ]],
    ["Chaussures homme", [
      "Baskets homme", "Sandales homme", "Tongs et claquettes homme", "Chaussures de ville homme",
      "Mocassins homme", "Bottes homme", "Chaussures de sport homme", "Chaussures de travail et sécurité",
      "Chaussons et pantoufles",
    ]],
    ["Chaussures enfant", [
      "Baskets enfant", "Sandales enfant", "Chaussures scolaires", "Bottes de pluie enfant",
      "Chaussures premiers pas",
    ]],
    ["Lingerie et pyjamas", [
      "Soutiens-gorge", "Culottes et slips", "Corsets et gaines", "Nuisettes et robes de chambre",
      "Pyjamas femme", "Pyjamas homme", "Pyjamas enfant", "Boxers et caleçons", "Lingerie de mariée",
    ]],
    ["Sacs et bagages", [
      "Sacs à main", "Sacs à dos", "Sacs bandoulière", "Pochettes et clutchs", "Sacs de voyage",
      "Valises", "Cabas et paniers", "Sacs banane", "Portefeuilles", "Porte-monnaie", "Sacs d'école",
      "Sacs en paille",
    ]],
    ["Bijoux et accessoires", [
      "Colliers", "Bracelets", "Boucles d'oreilles", "Bagues", "Montres homme", "Montres femme",
      "Parures de bijoux", "Bijoux de cheville", "Ceintures", "Lunettes de soleil", "Chapeaux et casquettes",
      "Bonnets et écharpes", "Gants", "Parapluies", "Épingles et broches", "Bijoux de mariage",
      "Accessoires cheveux", "Perles et fournitures de bijouterie",
    ]],
    ["Mode traditionnelle et culturelle", [
      "Tenues de carnaval", "Tenues vodou et culturelles", "Madras et tissus créoles", "Tenues de Kanaval",
      "T-shirts drapeau haïtien", "Casquettes Ayiti", "Costumes de danse folklorique", "Tissus au mètre",
    ]],
  ]],
  ["Beauté", [
    ["Beauté et santé", [
      "Compléments alimentaires", "Matériel de santé à domicile", "Parapharmacie", "Hygiène féminine",
      "Hygiène bucco-dentaire", "Santé sexuelle et bien-être",
    ]],
    ["Soins du visage", [
      "Crèmes visage", "Sérums", "Nettoyants et démaquillants", "Masques visage", "Soins des yeux",
      "Protection solaire", "Gommages visage", "Soins anti-âge", "Soins peau noire et mate",
    ]],
    ["Soins du corps", [
      "Laits et beurres corporels", "Huiles corporelles", "Gommages corps", "Gels douche", "Savons de toilette",
      "Déodorants", "Soins des mains", "Soins des pieds", "Éclaircissants et unifiants",
    ]],
    ["Cheveux", [
      "Shampooings", "Après-shampooings", "Masques capillaires", "Huiles capillaires", "Défrisants et lissants",
      "Produits pour cheveux crépus et bouclés", "Gels et fixants", "Accessoires coiffure", "Perruques",
      "Tissages et mèches", "Tresses et extensions", "Colorations", "Brosses et peignes", "Tondeuses et lisseurs",
    ]],
    ["Maquillage", [
      "Fonds de teint", "Poudres", "Rouges à lèvres", "Gloss", "Mascaras", "Eye-liners", "Fards à paupières",
      "Sourcils", "Vernis à ongles", "Faux ongles", "Pinceaux et éponges", "Palettes et coffrets maquillage",
      "Démaquillage",
    ]],
    ["Parfums", [
      "Parfums femme", "Parfums homme", "Parfums mixtes", "Brumes parfumées", "Encens et parfums d'ambiance",
      "Huiles parfumées",
    ]],
    ["Hommes : soins et rasage", [
      "Rasoirs et lames", "Produits de rasage", "Soins de la barbe", "Soins visage homme",
    ]],
    ["Manucure et pédicure", ["Coupe-ongles et limes", "Kits de manucure", "Soins des ongles"]],
  ]],
  ["Maison", [
    ["Maison et cuisine", [
      "Casseroles et poêles", "Marmites et faitouts", "Autocuiseurs", "Couteaux de cuisine", "Ustensiles de cuisine",
      "Planches à découper", "Assiettes", "Verres et gobelets", "Tasses et mugs", "Couverts", "Services de table",
      "Plateaux et paniers de service", "Boîtes de conservation", "Bouteilles et thermos", "Cafetières et théières",
      "Moulins et pilons", "Moules à pâtisserie", "Rangement de cuisine", "Nappes et sets de table",
      "Torchons et tabliers", "Glacières",
    ]],
    ["Meubles", [
      "Canapés", "Canapés d'angle", "Fauteuils", "Poufs et banquettes", "Tables basses", "Meubles TV",
      "Tables à manger", "Chaises", "Tabourets et bancs", "Buffets et vaisseliers", "Lits", "Matelas",
      "Sommiers", "Armoires et dressings", "Commodes", "Tables de chevet", "Bureaux", "Chaises de bureau",
      "Bibliothèques et étagères", "Meubles de salle de bain", "Meubles d'entrée", "Meubles de jardin",
      "Hamacs et balancelles", "Berceaux et lits bébé", "Meubles en bois massif", "Meubles en rotin et bambou",
    ]],
    ["Électroménagers", [
      "Réfrigérateurs", "Congélateurs", "Lave-vaisselle", "Lave-linge", "Sèche-linge", "Cuisinières",
      "Plaques de cuisson", "Fours", "Micro-ondes", "Hottes", "Climatiseurs", "Ventilateurs", "Chauffe-eau",
      "Aspirateurs", "Fers à repasser", "Mixeurs et blenders", "Robots de cuisine", "Bouilloires",
      "Cafetières électriques", "Grille-pain", "Friteuses", "Cuiseurs à riz", "Fontaines à eau", "Purificateurs d'eau",
      "Machines à coudre",
    ]],
    ["Outillage et amélioration de l'habitat", [
      "Perceuses et visseuses", "Scies", "Marteaux et outils à main", "Clés et pinces", "Boîtes à outils",
      "Échelles et escabeaux", "Peinture", "Pinceaux et rouleaux", "Quincaillerie", "Serrures et cadenas",
      "Plomberie", "Robinetterie", "Électricité et câbles", "Interrupteurs et prises", "Carrelage", "Parquets et sols",
      "Portes et fenêtres", "Ciment et matériaux", "Tôles et toitures", "Équipements de sécurité",
    ]],
    ["Décoration", [
      "Lampes de table", "Lampes de chevet", "Lampadaires", "Suspensions et lustres", "Lampes en bambou et rotin",
      "Lampes artisanales", "Appliques murales", "Guirlandes lumineuses", "Bougies", "Bougeoirs", "Vases",
      "Miroirs", "Cadres photo", "Tableaux décoratifs", "Posters", "Horloges murales", "Statues et figurines",
      "Décoration murale", "Décoration en bois", "Décoration en fer découpé", "Plantes artificielles", "Pots et jardinières",
      "Coussins décoratifs", "Plaids et jetés", "Tapis", "Rideaux", "Voilages", "Stores", "Moustiquaires",
      "Décoration de Noël", "Décorations de table de fête",
    ]],
    ["Style Bali et tropical", [
      "Décoration style Bali", "Meubles en teck", "Sculptures en bois exotique", "Paravents", "Masques muraux",
      "Lanternes tropicales", "Mobilier en bambou", "Paniers tressés décoratifs", "Hamacs tropicaux",
      "Ambiance bord de mer",
    ]],
    ["Linge de maison", [
      "Draps", "Housses de couette", "Couettes et édredons", "Oreillers", "Taies d'oreiller", "Couvre-lits",
      "Serviettes de bain", "Peignoirs", "Serviettes de plage", "Tapis de bain", "Rideaux de douche",
      "Nappes", "Linge de table",
    ]],
    ["Salle de bain", [
      "Miroirs de salle de bain", "Accessoires de salle de bain", "Paniers à linge", "Douches et pommeaux",
      "Lavabos", "WC et sanitaires", "Paniers et rangements salle de bain",
    ]],
    ["Rangement et organisation", [
      "Boîtes de rangement", "Étagères de rangement", "Porte-manteaux", "Cintres", "Paniers de rangement",
      "Organiseurs", "Meubles à chaussures",
    ]],
    ["Entretien et nettoyage", [
      "Balais et serpillières", "Seaux et bassines", "Produits ménagers", "Lessives", "Désinfectants",
      "Insecticides", "Sacs poubelle", "Poubelles", "Papier et essuie-tout",
    ]],
    ["Jardin et extérieur", [
      "Outils de jardin", "Arrosage", "Graines et semences", "Plants et plantes", "Terreaux et engrais",
      "Barbecues et grils", "Parasols", "Salons de jardin", "Éclairage extérieur", "Piscines et accessoires",
      "Clôtures et grillages", "Générateurs", "Lampes solaires de jardin", "Batteries et onduleurs",
    ]],
  ]],
  ["Saveurs", [
    ["Alimentation et épicerie", [
      "Riz", "Haricots et légumineuses", "Farines", "Sucre et sirops", "Huiles de cuisine", "Pâtes",
      "Conserves de légumes", "Conserves de poisson", "Sauces tomate", "Lait et produits laitiers",
      "Céréales et petit-déjeuner", "Biscuits et gâteaux secs", "Bonbons et confiseries", "Chocolat",
      "Snacks et chips", "Condiments", "Sel et assaisonnements", "Produits d'importation",
    ]],
    ["Spécialités haïtiennes", [
      "Pikliz", "Epis", "Sirop de canne", "Clairin", "Rhum haïtien", "Kremas", "Akasan", "Tablèt pistach",
      "Tablèt kokoye", "Dous makos", "Pate kodé", "Mayi moulen", "Soupe joumou : épices",
      "Café haïtien", "Cacao haïtien", "Manba (beurre d'arachide)", "Chadèque et confitures", "Mangues séchées",
      "Fruits à pain", "Cassave",
    ]],
    ["Boissons", [
      "Café", "Thé et infusions", "Jus de fruits", "Eau en bouteille", "Sodas", "Boissons énergisantes",
      "Bières", "Vins", "Spiritueux", "Liqueurs", "Sirops", "Boissons locales", "Lait de coco",
    ]],
    ["Fruits, légumes et marché frais", [
      "Fruits frais", "Légumes frais", "Tubercules et racines", "Bananes plantain", "Herbes aromatiques",
      "Piments et épices fraîches", "Fruits secs", "Oeufs",
    ]],
    ["Viandes et poissons", [
      "Viande de boeuf", "Poulet", "Viande de porc", "Cabri", "Poissons frais", "Poissons séchés et fumés",
      "Fruits de mer", "Charcuterie", "Hareng saur",
    ]],
    ["Boulangerie et pâtisserie", ["Pain", "Gâteaux", "Biscuits artisanaux", "Viennoiseries", "Gâteaux d'anniversaire", "Gâteaux de mariage"]],
    ["Traiteur et plats préparés", ["Plats cuisinés", "Buffets et traiteur", "Sandwichs", "Repas congelés"]],
  ]],
  ["Artisanat", [
    ["Arts, artisanat et couture", [
      "Tissus", "Fils et laines", "Boutons et fermetures", "Patrons de couture", "Machines et aiguilles",
      "Fournitures de loisirs créatifs", "Matériel de peinture", "Toiles et châssis", "Papeterie artistique",
      "Fournitures de poterie",
    ]],
    ["Art haïtien", [
      "Peintures haïtiennes", "Peintures naïves", "Fer découpé", "Sculptures en métal", "Papier mâché",
      "Drapeaux vodou", "Mosaïques", "Poteries et céramique", "Art de récupération",
    ]],
    ["Objets de décoration artisanaux", [
      "Masques", "Tambours", "Instruments de musique artisanaux", "Boîtes sculptées", "Statuettes en bois",
      "Paniers artisanaux", "Objets en calebasse", "Objets en corne", "Objets en coco",
    ]],
    ["Cadeaux et souvenirs", [
      "Souvenirs d'Haïti", "Coffrets cadeaux", "Porte-clés", "Magnets", "Cartes postales", "T-shirts souvenirs",
      "Cartes de voeux", "Cadeaux personnalisés",
    ]],
  ]],
  ["Fait à la main", [
    ["Crochet et tricot", [
      "Sacs au crochet", "Bonnets au tricot", "Poupées au crochet", "Couvertures", "Vêtements au crochet",
      "Bijoux au crochet", "Déco au crochet", "Peluches et amigurumis",
    ]],
    ["Tableaux et peintures", [
      "Peintures à l'huile", "Peintures acryliques", "Aquarelles", "Dessins et illustrations", "Portraits",
      "Fresques murales", "Tableaux sur commande",
    ]],
    ["Vannerie et paille", [
      "Chapeaux de paille", "Paniers en paille", "Sacs en paille tressée", "Nattes et tapis tressés",
      "Corbeilles", "Éventails",
    ]],
    ["Bois et sculpture", [
      "Sculptures en bois", "Objets en bois tourné", "Jouets en bois artisanaux", "Plateaux en bois", "Meubles faits main",
      "Instruments de musique en bois",
    ]],
    ["Couture et broderie", [
      "Broderies", "Vêtements sur mesure", "Robes sur mesure", "Costumes sur mesure", "Linge brodé",
      "Retouches et ourlets", "Écussons et patchs",
    ]],
    ["Bijoux faits main", [
      "Colliers faits main", "Bracelets faits main", "Boucles d'oreilles faites main",
      "Bijoux en perles", "Bijoux en graines", "Bijoux en corne",
    ]],
    ["Cuir et maroquinerie", [
      "Sacs en cuir", "Ceintures en cuir", "Sandales en cuir", "Portefeuilles en cuir", "Étuis et housses en cuir",
    ]],
  ]],
  ["Fait maison", [
    ["Confitures et conserves", ["Confitures", "Marmelades", "Pâtes de fruits", "Conserves de légumes maison", "Fruits au sirop"]],
    ["Pâtisserie maison", ["Gâteaux maison", "Cookies et biscuits", "Tartes", "Beignets", "Desserts traditionnels"]],
    ["Épices et sauces", ["Mélanges d'épices", "Sauces piquantes", "Piments maison", "Marinades", "Condiments maison"]],
    ["Boissons maison", ["Jus maison", "Liqueurs maison", "Tisanes maison", "Sirops maison", "Rhum arrangé"]],
    ["Savons et cosmétiques maison", ["Savons artisanaux", "Baumes à lèvres", "Beurres de karité et de cacao", "Crèmes maison", "Bougies maison"]],
    ["Plats et repas faits maison", ["Plats du jour", "Repas pour événements", "Boîtes repas", "Sandwichs maison"]],
  ]],
  ["Bio et naturel", [
    ["Produits bio", ["Fruits et légumes bio", "Épicerie bio", "Café bio", "Cacao bio", "Miel", "Sucres naturels"]],
    ["Huiles et plantes", [
      "Huile de ricin (lwil maskriti)", "Huile de coco", "Huile d'avocat", "Huile de neem", "Plantes médicinales",
      "Tisanes de plantes", "Poudres de plantes", "Aloe vera",
    ]],
    ["Soins naturels", ["Savons naturels", "Beurres naturels", "Argile et poudres", "Soins capillaires naturels", "Remèdes de grand-mère"]],
    ["Alimentation saine", ["Super-aliments", "Graines et noix", "Farines sans gluten", "Produits sans sucre"]],
  ]],
  ["Électronique", [
    ["Téléphones et accessoires", [
      "Smartphones", "Téléphones basiques", "Coques et étuis", "Protections d'écran", "Chargeurs", "Câbles",
      "Batteries externes", "Écouteurs", "Casques sans fil", "Supports de téléphone", "Cartes mémoire",
      "Accessoires photo téléphone",
    ]],
    ["Électroniques", [
      "Enceintes bluetooth", "Radios", "Montres connectées", "Piles et chargeurs", "Lampes rechargeables",
      "Convertisseurs et transformateurs",
    ]],
    ["Informatique", [
      "Ordinateurs portables", "Ordinateurs de bureau", "Écrans", "Claviers et souris", "Imprimantes",
      "Encre et toners", "Disques durs", "Clés USB", "Routeurs et Wi-Fi", "Webcams", "Tablettes",
      "Sacs pour ordinateur", "Logiciels",
    ]],
    ["Image et son", [
      "Télévisions", "Home cinéma et barres de son", "Lecteurs DVD", "Décodeurs", "Antennes", "Microphones",
      "Caméras", "Appareils photo", "Projecteurs", "Sonorisation et DJ", "Instruments de musique électroniques",
    ]],
    ["Jeux vidéo", ["Consoles", "Manettes", "Titres de jeux vidéo", "Accessoires gaming", "Cartes cadeaux jeux"]],
    ["Énergie solaire et autonomie", [
      "Panneaux solaires", "Onduleurs", "Batteries solaires", "Régulateurs", "Kits solaires",
      "Lampes solaires et rechargeables", "Groupes électrogènes", "Stabilisateurs",
    ]],
    ["Sécurité et surveillance", ["Caméras de surveillance", "Alarmes", "Interphones", "Détecteurs", "Serrures électroniques"]],
  ]],
  ["Loisirs", [
    ["Jouets et jeux", [
      "Poupées", "Voitures et véhicules", "Peluches", "Jeux de construction", "Puzzles", "Jeux de société",
      "Jeux éducatifs", "Jouets en bois", "Jeux d'extérieur", "Cerfs-volants", "Déguisements",
      "Dominos et jeux de cartes", "Jouets d'éveil",
    ]],
    ["Sports et activités d'extérieur", [
      "Ballons de football", "Maillots de football", "Chaussures de football", "Basket-ball", "Volley-ball",
      "Boxe et arts martiaux", "Fitness et musculation", "Vélos", "Pièces de vélo", "Motos et scooters : accessoires",
      "Pêche", "Camping", "Randonnée", "Natation et plongée", "Planches et sports nautiques",
      "Équipements d'équipe", "Trophées et médailles",
    ]],
    ["Livres et médias", [
      "Romans", "Livres en créole", "Livres d'histoire d'Haïti", "Livres scolaires", "Livres pour enfants",
      "Bandes dessinées", "Cuisine et recettes", "Développement personnel", "Livres religieux",
      "Musique (CD et vinyles)", "Films et séries", "Magazines",
    ]],
    ["Musique et instruments", [
      "Guitares", "Claviers et pianos", "Batteries et percussions", "Tambours haïtiens", "Vaksin et instruments rara",
      "Instruments à vent", "Accessoires de musique", "Partitions",
    ]],
    ["Fêtes et événements", [
      "Décoration de fête", "Ballons", "Articles de mariage", "Articles d'anniversaire", "Cotillons",
      "Cartes d'invitation", "Costumes de Kanaval", "Matériel de sonorisation", "Location de matériel",
    ]],
    ["Religion et spiritualité", ["Bibles", "Chapelets", "Statues religieuses", "Tenues d'église", "Articles de culte"]],
    ["Voyage et tourisme", ["Accessoires de voyage", "Cartes et guides", "Souvenirs de voyage", "Adaptateurs de prise"]],
  ]],
  ["Bébé", [
    ["Bébé et maternité", [
      "Biberons et tétines", "Couches", "Lingettes", "Lait infantile", "Petits pots", "Poussettes",
      "Sièges auto bébé", "Porte-bébés", "Chaises hautes", "Parcs et tapis d'éveil", "Baignoires bébé",
      "Soins bébé", "Vêtements bébé", "Chaussons bébé", "Layette", "Doudous", "Articles d'allaitement",
      "Vêtements de grossesse et maternité",
    ]],
    ["Chambre de bébé", ["Lits bébé", "Matelas bébé", "Draps bébé", "Gigoteuses", "Mobiles", "Décoration de chambre bébé"]],
    ["Cadeaux de naissance", ["Coffrets naissance", "Cadeaux de baptême", "Albums photo bébé"]],
  ]],
  ["Automobile", [
    ["Pièces détachées", [
      "Filtres", "Plaquettes et freins", "Amortisseurs", "Batteries auto", "Pneus", "Jantes", "Bougies d'allumage",
      "Courroies", "Phares et feux", "Rétroviseurs", "Pièces de moteur", "Échappements", "Radiateurs",
      "Pièces de moto",
    ]],
    ["Entretien et produits", ["Huiles moteur", "Liquides de frein et de refroidissement", "Produits de nettoyage auto", "Cires et polish", "Additifs"]],
    ["Accessoires auto", [
      "Housses de siège", "Tapis de voiture", "Autoradios", "GPS", "Caméras de recul", "Chargeurs de voiture",
      "Désodorisants auto", "Porte-bagages", "Sièges auto enfant",
    ]],
    ["Outils et équipement garage", ["Crics et chandelles", "Compresseurs", "Clés et douilles", "Valises de diagnostic", "Câbles de démarrage"]],
    ["Motos et scooters", ["Casques de moto", "Pièces détachées moto", "Gants et protections", "Huiles et lubrifiants moto"]],
    ["Véhicules", ["Voitures d'occasion", "Motos", "Scooters", "Camions et utilitaires", "Bateaux"]],
  ]],
  ["Animaux", [
    ["Accessoires animaux", ["Colliers et laisses", "Gamelles", "Paniers et coussins", "Cages", "Jouets pour animaux", "Transport animaux"]],
    ["Alimentation animaux", ["Croquettes chien", "Croquettes chat", "Aliments pour volaille", "Aliments pour bétail", "Friandises"]],
    ["Soins et hygiène animaux", ["Shampooings animaux", "Antiparasitaires", "Brosses et toilettage"]],
    ["Élevage et agriculture", ["Poussins et volailles", "Matériel d'élevage", "Abreuvoirs et mangeoires", "Semences agricoles", "Outils agricoles", "Engrais et traitements"]],
  ]],
  ["Bureau et scolaire", [
    ["Fournitures scolaires", [
      "Cahiers", "Stylos et crayons", "Trousses", "Cartables", "Calculatrices", "Règles et compas",
      "Classeurs", "Manuels scolaires", "Accessoires d'uniforme", "Matériel de dessin",
    ]],
    ["Fournitures de bureau", [
      "Papier et ramettes", "Agrafeuses et perforateurs", "Enveloppes", "Marqueurs et surligneurs",
      "Tampons et cachets", "Chemises et dossiers", "Étiquettes", "Tableaux blancs",
    ]],
    ["Mobilier de bureau", ["Bureaux de travail", "Chaises ergonomiques", "Armoires de bureau", "Étagères de bureau"]],
    ["Impression et personnalisation", ["Cartes de visite", "Flyers et affiches", "T-shirts personnalisés", "Mugs personnalisés", "Banderoles", "Badges et enseignes"]],
  ]],
  ["Industrie et professionnels", [
    ["Matériaux de construction", ["Blocs et parpaings", "Fer à béton", "Sable et gravier", "Bois de construction", "Tuyaux PVC", "Peintures en gros", "Tôles en gros"]],
    ["Équipement professionnel", ["Équipement de restaurant", "Équipement de boulangerie", "Équipement de salon de coiffure", "Équipement de bureau en gros", "Rayonnages et vitrines", "Caisses enregistreuses et balances", "Emballages et sachets", "Uniformes professionnels"]],
    ["Agriculture et pêche", ["Matériel de pêche professionnel", "Filets et lignes", "Pompes et irrigation", "Serres et bâches", "Sacs et conditionnement"]],
    ["Santé professionnelle", ["Matériel médical", "Fauteuils roulants et béquilles", "Tensiomètres et thermomètres", "Gants et masques", "Blouses et tenues médicales"]],
    ["Vente en gros", ["Lots de vêtements", "Lots de chaussures", "Lots d'électronique", "Lots d'alimentation", "Palettes de déstockage"]],
  ]],
  ["Services", [
    ["Livraison et transport", ["Livraison à domicile", "Transport de marchandises", "Déménagement", "Envoi de colis vers Haïti", "Envoi de colis vers la diaspora"]],
    ["Réparation et maintenance", ["Réparation de téléphones", "Réparation d'ordinateurs", "Réparation d'électroménagers", "Plomberie (dépannage)", "Électricité", "Climatisation", "Mécanique"]],
    ["Beauté et bien-être (services)", ["Coiffure", "Barbier", "Maquillage à domicile", "Massage", "Manucure"]],
    ["Événements (services)", ["Photographie", "Vidéo", "Décoration d'événements", "DJ et animation", "Traiteur", "Organisation de mariage"]],
    ["Formation et cours", ["Cours de langues", "Soutien scolaire", "Formation informatique", "Cours de cuisine", "Cours de musique", "Cours de couture"]],
    ["Professionnels et entreprises", ["Comptabilité", "Traduction", "Graphisme et logo", "Création de site web", "Marketing et publicité", "Juridique"]],
    ["Immobilier et construction", ["Construction", "Peinture en bâtiment", "Architecture", "Location de maisons", "Vente de terrains"]],
  ]],
];
