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
     * Method that documents the entire dominion
     */
    appraise() {
        for (let room of global.Imperator.dominion) {
            this.document(room);
        }
    }
    
    /**
     * Method that documents the market status of a room
     * @param {String} room 
     */
    document(room) {
        let liveRoom = Game.rooms[room];
        if (!liveRoom || !liveRoom.terminal) return false;
        this.balances[room] = {};
        //iterate through all resources of note
        for (let res of this.resources) {
            //check to how much of that resource the room has, minus the amount currently selling
            //triple the requirement for the room's own mineral type
            let sellOrders = _.filter(Game.market.orders, order => order.roomName == room && order.type == ORDER_SELL && order.resourceType == res);
            let sellAmount = 0;
            for (let order of sellOrders) {
                sellAmount += order.amount;
            }
            let multiplier = 1;
            if (liveRoom.find(FIND_MINERALS)[0].mineralType == res) multiplier = 3;
            this.balances[room][res] = -this.getTarget(res) * multiplier + liveRoom.terminal.store[res] - sellAmount;

            //if it is twice as high as it should be, add the room to the surplus object
            if (this.balances[room][res] > this.getTarget(res)) {
                //add to array if it hasn't already been added
                if (this.surpluses[res].indexOf(room) < 0) {
                    this.surpluses[res].push(room);
                }
                //remove from the opposite array
                let index = this.shortages[res].indexOf(room);
                if (index >= 0) this.shortages[res].splice(index, 1);

            //if it is lower than the target, add it to the shortages list
            } else if (this.balances[room][res] < 0) {
                if (this.shortages[res].indexOf(room) < 0) {
                    this.shortages[res].push(room);
                }
                let index = this.surpluses[res].indexOf(room);
                if (index >= 0) this.surpluses[res].splice(index, 1);
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
        let excess = this.getExcess(room);
        if (excess.length == 0) return false;

        //check all the shortages for the excess resources we have and send the resource to that room
        for (let res of excess) {
            let shorts = this.shortages[res];
            if (shorts.length == 0) continue;
            let targetRoom = shorts[0];
            let amountAvailable = this.balances[room][res];
            let amountNeeded = this.balances[targetRoom][res];
            let amountToSend = Math.min(amountNeeded, amountAvailable);
            Game.rooms[room].terminal.send(res, amountToSend, targetRoom, 
                "Routine supplies shipment of " + res + " from " + room + " to " + targetRoom);
            break;
        }
    }

    /**
     * Method to list excess resources on the market
     */
    merchandise(room) {
        //check if the room has any surpluses
        let excess = this.getExcess(room);
        if (excess.length == 0) return false;

        for (let res of excess) {
            if (this.shortages[res].length > 0) return false;
            let surplus = this.balances[room][res];
            if (surplus > 5000) {
                let marketInfo = Game.market.getHistory(res);
                let today = marketInfo[marketInfo.length - 1];
                let price = (today["avgPrice"] * 0.85).toFixed(3);
                let success = Game.market.createOrder({
                    type: ORDER_SELL,
                    resourceType: res,
                    price: price,
                    totalAmount: surplus,
                    roomName: room   
                });

                if (success == OK) {
                    //remove from the surpluses list and reset balances
                    let index = this.surpluses[res].indexOf(room);
                    if (index >= 0) this.surpluses[res].splice(index, 1);
                    this.balances[room][res] = 0;
                    return true
                }
            }
        }
    }

    /**
     * Method that clears old outdated orders
     * @param {String} room 
     */
    clean(room) {
        let roomOrders = _.filter(Game.market.orders, order => order.roomName == room && order.type == ORDER_SELL);
        for (let order of roomOrders) {
            //cancel any orders with no more left to sell
            if (order.remainingAmount == 0) {
                Game.market.cancelOrder(order.id);
                continue;
            }

            //cancel orders older than 50000 ticks (~2 days)
            if (Game.time - order.created > 50000) {
                Game.market.cancelOrder(order.id);
                //increment balance back up
                this.balances[room][order.resourceType] += order.remainingAmount;
            }
        }
    }

    /**
     * Method to print off a table of every room and their current balances
     */
    printBalances() {
        let result = "<style> .balanceTable {border: 1px solid black; padding: 5px; text-align: center; color: black; background-color: #7d7d7dm;} </style>\
        <table style='width:200%' class='balanceTable'>\
        <caption>Resource Balances for Owned Rooms</caption>\
        <tr><th class='balanceTable'>Room</th>";
        for (let res of this.resources) {
            result += `<th class='balanceTable'>${res}</th>`;
        }
        result += "</tr>";
        for (let room in this.balances) {
            result += `<tr class='balanceTable'>` +
                `<td class='balanceTable'>${room}</td>`;
            for (let res in this.balances[room]) {
                let color = 'white';
                if (this.balances[room][res] > this.getTarget(res) * 2) {
                    color = 'green';
                } else if (this.balances[room][res] < 0) {
                    color = 'red';
                }
                result += `<td class='balanceTable' style="background-color:${color}">${this.balances[room][res]}</td>`;
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

    /**
     * Method that returns the minerals that a room has excess of
     * @param {String} room 
     * @returns Array containing resources that the room has excess of
     */
    getExcess(room) {
        let excess = [];
        for (let res in this.surpluses) {
            if (this.surpluses[res].includes(room)) {
                excess.push(res);
            }
        }
        return excess;
    }
}

module.exports = Vendor;