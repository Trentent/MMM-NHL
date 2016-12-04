/* Magic Mirror
 * Module: MMM-NHL
 *
 * By Trentent Tye https://github.com/trentent/MMM-NHL
 * MIT Licensed.
 */

Module.register("MMM-NHL", {

    modes: {
        "P": "Pre-Season",
        "R": "Regular-Season",
        "POST": "Post-Season"
    },

    season: {
        "20162017": "2016-17",
        t: "P"
    },

    states: {
        "1": "SCHEDULED",
        "2": "Pre-Game",
        "3": "Live",
        "4": "Live",
        "5": "OVERTIME",
        "6": "SHOOTOUT",
        "7": "FINAL",
        // 1 - 
        // 2 - Pre-Game
        // 3 - Live - In Progress
        // 4 - Live - In Progress Critical
        // 5 - 
        // 6 - 
        // 7 - Final

        //detailed states:
        // "Final",
        // "Game Over",
        // "In Progress - Critical",
        // "In Progress",
        // "Pre-Game",
        // "Scheduled",

    },

    teams: {
        "1" : "NJD",
        "2" : "NYI",
        "3" : "NYR",
        "4" : "PHI",
        "5" : "PIT",
        "6" : "BOS",
        "7" : "BUF",
        "8" : "MON",
        "9" : "OTT",
        "10" : "TOR",
        "12" : "CAR",
        "13" : "FLO",
        "14" : "TBL",
        "15" : "WAS",
        "16" : "CHI",
        "17" : "DET",
        "18" : "NAS",
        "19" : "STL",
        "20" : "CGY",
        "21" : "COL",
        "22" : "EDM",
        "23" : "VAN",
        "24" : "ANA",
        "25" : "DAL",
        "26" : "LAK",
        "28" : "SJS",
        "29" : "CLB",
        "30" : "MIN",
        "52" : "WPG",
        "53" : "ARI",
    },


    // Default module config.
    defaults: {
        text: "NHL Scores and schedule!",
        datesToLookAhead: 1, // try not to go too far in advance, makes big files and slows response time
        colored: true,
        focus_on: false,
        format: "ddd h:mm",
        reloadInterval: 30 * 60 * 1000       // every 30 minutes
    },

    

    getScripts: function() {
        return ["moment.js"];
    },

    getStyles: function () {
        return ["font-awesome.css", "MMM-NHL.css"];
    },
    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("CONFIG", this.config);
        moment.locale(config.language);

    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "SCORES") {
            this.scores = payload.scores;
            //console.log ("this.scores" + JSON.stringify(this.scores));
            this.updateDom(300);
        }
    },

    // Override dom generator.
    getDom: function () {
        var wrapper = document.createElement("div");
        var scores = document.createElement("div");
        var header = document.createElement("header");
        //console.log ("yoyoyo" + JSON.stringify(this.scores[1].games[0].gameType));
        

        if (!this.scores) {
            var text = document.createElement("div");
            text.innerHTML = this.translate("LOADING");
            text.classList.add("dimmed", "light");
            scores.appendChild(text);
        } else {
            header.innerHTML = "NHL " + this.modes[this.scores[1].games[0].gameType] + " " + this.season[this.scores[1].games[0].season];
            scores.appendChild(header);
            var table = document.createElement("table");
            table.classList.add("small", "table");

            table.appendChild(this.createLabelRow());
        
            //count the number of games.  To do we'll get the number of games for each day and add them together
            var allGames = [];
            for (var i = 0; i < this.scores.length; i++) {
                allGames.push(this.scores[i].games);
            }


            //console.log("total number of games in the selected days:" + JSON.stringify(allGames[0][1]));


            for (var i = 0; i < allGames.length; i++) {
                for (var j = 0; j < allGames[i].length; j++) {
                    //console.log ("thisAppendDataRow" + allGames.length);
                    this.appendDataRow(allGames[i][j], table);
                }
            }


            scores.appendChild(table);



        }

        wrapper.appendChild(scores);

        return wrapper;
    },


    createLabelRow: function () {
        var labelRow = document.createElement("tr");

        var dateLabel = document.createElement("th");
        var dateIcon = document.createElement("i");
        dateIcon.classList.add("fa", "fa-calendar");
        dateLabel.appendChild(dateIcon);
        labelRow.appendChild(dateLabel);

        var homeLabel = document.createElement("th");
        homeLabel.innerHTML = this.translate("HOME");
        homeLabel.setAttribute("colspan", 3);
        labelRow.appendChild(homeLabel);

        var vsLabel = document.createElement("th");
        vsLabel.innerHTML = "";
        labelRow.appendChild(vsLabel);

        var awayLabel = document.createElement("th");
        awayLabel.innerHTML = this.translate("AWAY");
        awayLabel.setAttribute("colspan", 3);
        labelRow.appendChild(awayLabel);

        return labelRow;
    },

    appendDataRow: function (data, appendTo) {
        //console.log ("data" + JSON.stringify(data));
        if(!this.config.focus_on || this.config.focus_on.indexOf(data.teams.home.team.id) !== -1 || this.config.focus_on.indexOf(data.teams.away.team.id) !== -1) {
            var row = document.createElement("tr");
            row.classList.add("row");



            var date = document.createElement("td");
            if (data.status.detailedState === "In Progress" ||  data.status.detailedState === "In Progress - Critical") {
                if (data.status.codedGameState != 7 || data.status.codedGameState != 1 ) {
                    var time = document.createElement("div");
                    time.classList.add("live");
                    time.innerHTML = data.linescore.currentPeriodOrdinal + " " + data.linescore.currentPeriodTimeRemaining;
                    date.appendChild(time);
                }
            } else if (data.status.abstractGameState === "Preview") {
                //console.log ("Preview gameDate" + JSON.stringify(moment(data.gameDate).format(this.config.format)));
                date.innerHTML = moment(data.gameDate).format(this.config.format);
            } else {
                //console.log ("elseData" + JSON.stringify(moment(data.gameDate).format(this.config.format)));
                date.innerHTML = data.status.detailedState;
                date.classList.add("dimmed");
            }
            row.appendChild(date);

            var homeTeam = document.createElement("td");
            homeTeam.classList.add("align-right");
            var homeTeamSpan = document.createElement("span");
            homeTeamSpan.innerHTML = this.teams[data.teams.home.team.id];
            homeTeam.appendChild(homeTeamSpan);
            row.appendChild(homeTeam);

            var homeLogo = document.createElement("td");
            homeLogo.style.height = '50px';
            homeLogo.style.width = '50px';
            var homeIcon = document.createElement("img");
            homeIcon.src = this.file("2016icons/" + data.teams.home.team.id + ".svg");
            if (!this.config.colored) {
                homeIcon.classList.add("icon");
            }
            homeLogo.appendChild(homeIcon);
            row.appendChild(homeLogo);

            var homeScore = document.createElement("td");
            homeScore.innerHTML = data.teams.home.score;
            row.appendChild(homeScore);

            var vs = document.createElement("td");
            vs.innerHTML = ":";
            row.appendChild(vs);

            var awayScore = document.createElement("td");
            awayScore.innerHTML = data.teams.away.score;
            row.appendChild(awayScore);

            var awayLogo = document.createElement("td");
            var awayIcon = document.createElement("img");
            awayLogo.style.height = '50px';
            awayLogo.style.width = '50px';
            awayIcon.src = this.file("2016icons/" + data.teams.away.team.id + ".svg");
            if (!this.config.colored) {
                awayIcon.classList.add("icon");
            }
            if (this.config.helmets) {
                awayIcon.classList.add("away");
            }
            awayLogo.appendChild(awayIcon);
            row.appendChild(awayLogo);

            var awayTeam = document.createElement("td");
            awayTeam.classList.add("align-left");
            var awayTeamSpan = document.createElement("span");
            awayTeamSpan.innerHTML = this.teams[data.teams.away.team.id];
            awayTeam.appendChild(awayTeamSpan);
            row.appendChild(awayTeam);

            appendTo.appendChild(row);
        }
    },

});
