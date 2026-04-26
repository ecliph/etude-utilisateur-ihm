# Application Todo Coach - Prototype pour Étude Utilisateur

Ce projet est la Version A améliorée du prototype "Todo Coach" dans le cadre du projet d'Interaction Humain-Machine (IHM). Il intègre les deux scénarios d'usage et l'instrumentation pour réaliser les tests utilisateurs.

## 1. Objectif du prototype
Ce prototype a été adapté pour simuler le comportement réel de l'application et récolter des métriques lors de l'étude utilisateur. L'objectif est d'observer et compiler les succès, erreurs, et temps d'exécution des utilisateurs durant le test.

## 2. Scénarios testés
1. **Scénario 1 : Création et planification d'une tâche**  
   L'utilisateur doit lister les tâches, en créer une nouvelle, puis la visualiser dans la section "Calendrier" et y modifier sa durée.
2. **Scénario 2 : Gestion de projet de groupe et Mode Focus**  
   L'utilisateur ouvre le Taskboard de groupe, génère des sous-tâches pour la tâche t1, ajoute un temps de préparation t3 pour la tâche t2, et lance le mode Focus sur t1. 

## 3. Données de test utilisées
Au démarrage d'un test utilisateur, un jeu de données "frais" et par défaut (`data.js`) est injecté :
- Une tâche "Préparer la présentation du projet" (t1, 60 minutes).
- Une tâche "Réunion de groupe" (t2, 45 minutes).
- 5 catégories prédéfinies prêtes à l'emploi.

## 4. Comment lancer l'application
Puisqu'il n'y a pas de backend, ouvrez simplement le fichier `index.html` dans le dossier `version_A_final/` avec n'importe quel navigateur web (Chrome, Firefox, Safari).

## 5. Comment lancer un test utilisateur
1. Cliquez sur le bouton rouge **🔬 Mode Test Utilisateur** dans la barre latérale.
2. Entrez l'identifiant du participant (ex: `P01`) et choisissez le scénario (1 ou 2).
3. Cliquez sur **Démarrer Test**.
4. Le chronomètre démarre et toutes les données sont remises à zéro (le jeu de test est chargé).

## 6. Comment réaliser le scénario 1
1. **Liste des tâches** : Cliquez sur "Ajouter / Modifier une tâche".
2. Remplissez le nom de la tâche, l'heure, la durée, et sélectionnez une catégorie existante. Enregistrez.
3. Cliquez sur **Calendrier Journalier** dans la barre latérale (ou naviguez via les onglets selon l'affichage).
4. La tâche apparaît dans la colonne des heures de la journée.
5. **Modification de durée** : Cliquez en bas du bord d'une tâche dans le calendrier et tirez (Drag & Drop) pour modifier visuellement sa durée. 
6. L'observateur clique sur "Marquer étape réussie" dans le test panel.

## 7. Comment réaliser le scénario 2
1. **Taskboard** : Cliquez sur "Taskboard (Projet)" dans le volet latéral.
2. Sur la tâche t1, cliquez sur **Générer les sous-tâches**.
3. Sur la tâche t2, cliquez sur **Ajouter un temps de préparation**.
4. Revenez sur t1, cliquez sur le bouton vert **Lancer le mode focus**.
5. Cochez **Mode Simulation** (si vous souhaitez un temps accéléré 60 fois plus rapide) et attendez la fin du timer, ou cliquez sur **Valider et Terminer**.
6. L'observateur clique sur "Marquer étape réussie" dans le test panel.

## 8. Mesures collectées (JSON Export)
Lorsqu'un test est clôturé, un fichier JSON est téléchargé, contenant :
- `participantId` (ex: P01)
- `scenario`
- Heure de début et de fin.
- `durationSeconds`
- Nombre de clics mesuré (`clickCount`)
- Étapes validées (`completedSteps`)
- Tableau des erreurs / incidents (`errors`)
- Statut de réussite / échec réel.
- Le commentaire de l'observateur.

## 9. Comment exporter les résultats
Depuis le panneau "Mode Test Utilisateur", cliquez soit sur **🏁 Terminer (Succès)**, soit sur **❌ Terminer (Échec)**. Le navigateur s'occupe de télécharger automatiquement le fichier des résultats au format JSON.

## 10. Limites de la version actuelle
- Les données restent statiques, sauvegardées uniquement dans le Storage local (Aucun serveur n'est présent).
- Le visuel reste basique afin de minimiser le facteur complexe lors de l'étude (pas de Drag & Drop parfait de colonne à colonne sur le board).

## 11. Améliorations possibles
- Un véritable système de base de données (Firebase/Supabase).
- Des fonctionnalités complètes en Drag and Drop sur le calendrier.
- Synchronisation en live de l'observateur sur une autre tablette (WebSockets).
