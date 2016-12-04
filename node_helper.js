/* Magic Mirror
 * Module: MMM-NHL
 *
 * By Trentent Tye https://github.com/trentent/MMM-NHL
 * MIT Licensed.
 */

const request = require('request');
const moment = require('moment-timezone');
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

    //url:  "https://statsapi.web.nhl.com/api/v1/schedule?teamId=&gameType=PR,R,P&startDate=2016-11-29&endDate=2016-12-07&expand=schedule.team",

    scores: [],
    details: {},
    nextMatch: null,
    live: {
        state: false,
        matches: []
    },

    start: function() {
        console.log("Starting module: " + this.name);
        var url = "";
    },

    socketNotificationReceived: function(notification, payload) {
        if(notification === 'CONFIG'){
            this.config = payload;
            var today = moment().format("YYYY-MM-DD");
            var yesterday = moment().subtract(1, 'd').format("YYYY-MM-DD");
            var future = moment().add(this.config.datesToLookAhead, 'd').format("YYYY-MM-DD");
            //console.log ("t" + today + " y " + yesterday + " f " + future);

            //build URL
            url = "https://statsapi.web.nhl.com/api/v1/schedule?teamId=&gameType=PR,R,P&startDate=" + yesterday + "&endDate=" + future + "&expand=schedule.team,schedule.linescore,schedule.brodcasts,schedule.metadata"
            //console.log ("built url:" + url);
            
            this.getData();
            setInterval(() => {
                this.getData();
            }, this.config.reloadInterval);
            setInterval(() => {
                this.fetchOnLiveState();
            }, 60*1000);
        }
    },

    getData: function() {
        request(url, (error, response, body) => {
            if (response.statusCode === 200) {
                var result = JSON.parse(body);

                //console.log("stringify " + JSON.stringify(result));
                this.scores = result.dates;

                this.setMode();
                //console.log ("sending score" + moment().format('LLLL'));
                this.sendSocketNotification("SCORES", {scores: this.scores});
                return;
            } else {
                console.log("Error no NHL data");
            }
        });
    },


    setMode: function(){
        //console.log("pre scores" + JSON.stringify(this.scores));
        var current_date = new Date();
        if(this.mode === "regular" && this.scores[0].gameType == "P"){
            this.mode = "post";
            this.getData();
            return;
        } else if(this.mode === "post" && this.scores[0].gameType == "R"){
            this.mode = "regular";
            this.getData();
            return;
        }

    },

    fetchOnLiveState: function(){
        if(this.live.state === true){
            this.getData();
        }
    }
});