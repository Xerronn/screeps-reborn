//inter-room resource sharing and market manager
class Vendor {
    constructor() {
        this.balances = {};
        this.surpluses = {};
        this.shortages = {};

        this.resources = [
            RESOURCE_ENERGY,
            RESOURCE_HYDROGEN,
            RESOURCE_OXYGEN,
            RESOURCE_UTRIUM,
            RESOURCE_LEMERGIUM,
            RESOURCE_KEANIUM,
            RESOURCE_ZYNTHIUM,
            RESOURCE_CATALYST
        ]

        for (let res of this.resources) {
            this.surpluses[res] = [];
            this.shortages[res] = [];
        }
    }
    
    /**
     * Method that fills out the statistics of a room
     * @param {String} room 
     */
    document(room) {
        this.balances[room] = {};
        let liveRoom = Game.rooms[room];
        if (!liveRoom || !liveRoom.terminal) return false;

        for (let res of this.resources) {
            this.balances[room][res] = -this.getTarget(res) + liveRoom.terminal.store[res];
            if (this.balances[room][res] > this.getTarget(res) * 1.3) {
                //add to array if it hasn't already been added
                if (surpluses[res].indexOf(room) < 0) {
                    this.surpluses[res].push(room);
                }
                //remove from the opposite array
                let index = shortages[res].indexOf(room);
                if (index >= 0) shortages[res].splice(index, 1);

            } else if (this.balances[room][res] < this.getTarget(res)) {
                if (shortages[res].indexOf(room) < 0) {
                    this.shortages[res].push(room);
                }
                let index = surpluses[res].indexOf(room);
                if (index >= 0) surpluses[res].splice(index, 1);
            }
        }
        return true;
    }

    /**
     * Method to buy resources that are needed if they are not available from other rooms
     * @param {} room 
     */
    requisition(room) {
        //first check if this room has any shortages
    }

    /**
     * Method to send resources to other rooms
     */
    relinquish(room) {
        //first check if this this room has any surpluses
        
    }

    /**
     * Method to list excess resources on the market
     */
    merchandise(room) {

    }

    /**
     * Method to print off a table of every room and their current balances
     */
    printBalances() {
        let result = "<style>table, th, td {border: 1px solid black; padding: 5px; text-align: center} </style>\
        <table style='width:200%'>\
        <caption>Resource Balances for Owned Rooms</caption>\
        <tr><th>Room</th>";
        for (let res of this.resources) {
            result += `<th>${res}</th>`;
        }
        result += "</tr>";
        for (let room in this.balances) {
            result += `<tr>` +
                `<td>${room}</td>`;
            for (let res in this.balances[room]) {
                let color = 'white';
                if (this.balances[room][res] > this.getTarget(res) * 1.3) {
                    color = 'green';
                } else if (this.balances[room][res] < this.getTarget(res)) {
                    color = 'red';
                }
                result += `<td style= "background-color:${color}">${this.balances[room][res]}</td>`;
            }
            result += `</tr>`;
        }
        result += "</table>";
        console.log(result);
    }

    /**
     * Method that returns the target number of a resource
     * @param {String} resourceType 
     * @returns Target number of resource in the terminal
     */
    getTarget(resourceType) {
        switch (resourceType) {
            case RESOURCE_ENERGY:
                return 20000;
            default:
                return 10000;
        }
    }
}

module.exports = Vendor;