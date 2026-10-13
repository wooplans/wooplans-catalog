# RÈGLE WooPlans — Plans de distribution 2D améliorés

Référence : « applique la règle plans 2D améliorés WooPlans » (fichier : `docs/plans-2d-ameliores/REGLE.md`, dépôt wooplans/wooplans-catalog).

## Objectif
Transformer un plan de distribution « 2D simple » (dessin CAO, PDF) en rendu 2D de présentation photoréaliste vue du dessus, avec textes en français propres.

## Réglages PoYo (fixes)
- Modèle `gpt-image-2.5-flare`, quality `low`, resolution `1K`, output_format `png`
- `image_urls` = plan de référence en URL https publique (recadré sur le plan seul, sans titre ni cartouche)
- `size` = ratio le plus proche du plan source (5:4 paysage, 2:3 ou 3:4 portrait, 9:16 très haut)
- Coût : 1,31 crédit par image

## Pipeline
1. **Capturer** : si le plan est dans un PDF → `pdftoppm -r 300` de la page, recadrer le plan (inclure garage, voiture, terrasses ; vérifier que rien n'est coupé en bas/à droite), max ~1500 px.
2. **Héberger** : copier dans `tmp/` du dépôt wooplans-catalog, commit + push, utiliser l'URL `raw.githubusercontent.com/wooplans/wooplans-catalog/master/tmp/<fichier>.png`. Supprimer `tmp/` en fin de lot.
3. **Générer SANS TEXTE** (prompt ci-dessous), un job par niveau (RDC, étage…).
4. **Vérifier** la géométrie : murs, escaliers, portes, fenêtres identiques ; pièces correctement meublées (sanitaires/buanderie non intervertis).
5. **Retoucher en local si besoin** : meubles posés sur une terrasse qui ne doit pas en avoir → effacer ; toiture (rectangle avec flèche du nord à l'étage) = toiture, pas terrasse → redessiner hachures + flèche.
6. **Ajouter les textes après génération** avec `etiquettes_generic.py` (PIL, Liberation Sans Bold) : nom en noir, surface en rouge, en français. Pièces étroites : 3 lignes courtes. Garder la notation d'origine des surfaces (virgules, `*`). Aucun texte ne touche un mur ou une porte ; ajuster et relancer.
7. **Livrer** les PNG finaux + résumé court (points à vérifier).

## Règles de contenu
- Sols intérieurs (y compris couloirs, halls hachurés gris) : **blanc pur**
- Cabines de douche / pièces d'eau : **bleu ciel léger**
- Terrasses : **gris clair uniforme** ; garage : gris clair
- Murs : noirs pleins, continus ; aucune ouverture là où il n'y a ni porte ni fenêtre
- Portes : un seul battant, un seul arc fin ; fenêtres fines bleu clair
- Meubles réalistes vus du dessus, ombres douces, plantes sur terrasses ; pas de personnages, pas de 3D
- Conserver escaliers, flèche du nord, voiture/garage, cercles et axes de structure
- Renommer les pièces mal nommées dans l'original (ex. « SAS » qui est en fait la Cuisine ; traduire Kitchen→Cuisine, Dining→Salle à manger, Living→Salon, Study→Salle d'étude, Master's Bedroom→Chambre P., Guest Toilet→WC visiteurs, Bath(SBD)→SDB, Terrace→Terrasse)
- Si l'IA interprète la toiture comme une terrasse : corriger localement

## Prompt de base (à adapter ; en français)
```
Transforme ce plan 2D simple en plan 2D rendu de présentation immobilière photoréaliste, vue du dessus.

RÈGLE ABSOLUE : conserve EXACTEMENT la géométrie du plan : tous les murs, escaliers, portes et fenêtres à leur place exacte. Aucun mur modifié, ajouté ou supprimé. Les murs restent noirs pleins et continus. Aucune ouverture là où il n'y a ni porte ni fenêtre. Conserve aussi le garage et la voiture, les cercles et axes de structure.

[OPTIONNEL — CONTENU EXACT DE CHAQUE PIÈCE : « pièce en haut à gauche = chambre avec lit double ; ... » — à ajouter si l'IA intervertit des pièces]

SOLS : tous les sols intérieurs, y compris couloirs et halls (même hachurés en gris sur l'original), sont blancs purs. Seules les cabines de douche ont un léger bleu ciel. Les terrasses ont un gris clair uniforme.

STYLE : meubles réalistes vus du dessus avec ombres douces (lits avec draps, canapés, table à manger, cuisine équipée, sanitaires, lavabos, dressing avec rangements, plantes sur les terrasses), portes propres à un seul battant avec un seul arc fin, fenêtres fines bleu clair, ombres légères, fond blanc.

TEXTE : AUCUN TEXTE dans l'image. Supprime toutes les étiquettes, noms de pièces, surfaces, dimensions, titres et filigranes. Aucune lettre, aucun chiffre.

QUALITÉ : propre, net, haute lisibilité. Pas de personnages, pas de 3D, pas de murs inventés.
```

## Pièges connus
- Texte généré par l'IA qui chevauche les murs → toujours générer sans texte puis superposer
- Couloirs rendus gris, portes en zig-zag, libellés en anglais → règles ci-dessus
- Pièces intervertis (buanderie/sanitaire) → bloc « contenu exact de chaque pièce »
- Toiture prise pour une terrasse → retouche locale
- Recadrage qui coupe voiture/terrasse → vérifier les bords avant l'envoi

## Fichiers
- `etiquettes_generic.py` : `python3 -I etiquettes_generic.py in.png out.png labels.json`
- `exemple_labels.json` : format `{"x","y","size","lines":[nom, surface…],"nblack":1}` (coordonnées en pixels de l'image générée)
