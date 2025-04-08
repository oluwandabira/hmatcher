import {decryptMessage} from "./cryptolib.js"

// Function to fetch event listing from the events directory
async function fetchEventIndex() {
    try {
        const response = await fetch('events/index.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch event index: ${response.status} ${response.statusText}`);
        }
        
        const eventList = await response.json();
        return eventList;
    } catch (error) {
        console.error('Error fetching event index:', error);
        throw error;
    }
}

// Function to fetch event data by ID
async function fetchEventData(eventId) {
    try {
        const response = await fetch(`events/${eventId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch event data: ${response.status} ${response.statusText}`);
        }
        
        const eventData = await response.json();
        return eventData;
    } catch (error) {
        console.error(`Error fetching event ${eventId}:`, error);
        throw error;
    }
}

// Load events into the dropdown
window.onload = async function() {
    // Fetch event index
    const eventsIndex = await fetchEventIndex();
    
    // Populate the dropdown
    const eventSelect = document.getElementById("eventSelect");
    
    // Clear existing options except the first one
    while (eventSelect.options.length > 1) {
        eventSelect.remove(1);
    }
    
    // Add available events
    for (const event of eventsIndex) {
        const option = document.createElement("option");
        option.value = event.id;
        option.textContent = event.title;
        eventSelect.appendChild(option);
    }
    // // Add available events
    // for (const eventId in eventsDB) {
    //     const option = document.createElement("option");
    //     option.value = eventId;
    //     option.textContent = eventsDB[eventId].title;
    //     eventSelect.appendChild(option);
    // }
    
    // Event listener for event selection
    eventSelect.addEventListener("change", function() {
        const accessForm = document.getElementById("accessForm");
        const messageContainer = document.getElementById("messageContainer");
        const errorMsg = document.getElementById("errorMsg");
        
        if (this.value) {
            accessForm.classList.remove("hidden");
            messageContainer.classList.add("hidden");
            errorMsg.classList.add("hidden");
            
            // Clear previous inputs
            document.getElementById("name").value = "";
            document.getElementById("password").value = "";
            document.getElementById("message").textContent = "";
        } else {
            accessForm.classList.add("hidden");
            messageContainer.classList.add("hidden");
        }
    });

    const viewBtn = document.getElementById("viewBtn");
    viewBtn.addEventListener("click", decrypt)
};

// Function to decrypt message
async function decrypt() {
    const eventId = document.getElementById("eventSelect").value;
    const name = document.getElementById("name").value.toLowerCase().trim();
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");
    const messageContainer = document.getElementById("messageContainer");
    const viewBtn = document.getElementById("viewBtn");
    
    if (!eventId || !name || !password) {
        errorMsg.textContent = "Please fill in all fields";
        errorMsg.classList.remove("hidden");
        return;
    }
    
    const eventData = await fetchEventData(eventId);
    
    if (!eventData) {
        errorMsg.textContent = "Event not found";
        errorMsg.classList.remove("hidden");
        return;
    }
    
    // Find the message for this recipient
    const messageData = eventData.find(msg => msg.recipient === name);
    
    if (!messageData) {
        errorMsg.textContent = "No message found for this name in this event";
        errorMsg.classList.remove("hidden");
        return;
    }
    
    try {
        viewBtn.disabled = true;
        errorMsg.classList.add("hidden");
        
        const decryptedMessage = await decryptMessage(name, password, messageData);

        console.log("Decrpyted is ", decryptedMessage)
        
        // Display the decrypted message
        document.getElementById("message").textContent = decryptedMessage;
        messageContainer.classList.remove("hidden");
    } catch (error) {
        const errmessage = await error.message
        console.error("Decryption error:", error.name);
        errorMsg.textContent = "Incorrect keyword";
        errorMsg.classList.remove("hidden");
        messageContainer.classList.add("hidden");
    } finally {
        viewBtn.disabled = false;
    }
}
