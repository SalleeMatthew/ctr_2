<template>
  <div id="chat" class="flex flex-row chat space-x-1 p-1 text-chat w-full">
    <div class="messages-pane flex flex-col flex-1">
      <div class="flex-grow p-1 overflow-y-auto h-full" ref="chatArea"> 
        <div id="userMenu" 
          class="
            absolute
            w-40
          " 
          style="border: outset #EEE;" 
          @mouseleave="closeMenu()"
        >
          <ul>
            <li 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-black
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
              @click="closeMenu()">
              Cancel Menu
            </li>
            <li style="border: inset #EEE 3px;"></li>
            <li v-if="$store.data.view3d === true 
              && activePanel === 'users'" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-black
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
              @click="beamTo()">
              Beam to
            </li>
            <li v-if="activePanel === 'users'" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Start Whisper
            </li>
            <li v-if="activePanel === 'users'" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Invite Chat
            </li>
            <li v-if="activePanel === 'users'" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Ignore
            </li>
            <li v-if="activePanel === 'sharedObjects' 
              && !canTakeObject
              && isForSale" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Buy
            </li>
            <li v-if="activePanel === 'sharedObjects' 
              && $store.data.view3d
              && canDropObject" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-black
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              " 
              @click="moveObject()"
            >
              Move
            </li>
            <li v-if="activePanel === 'sharedObjects' 
              && canTakeObject" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Take
            </li>
            <li v-if="activePanel === 'backpack' 
              && canDropObject" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-black
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              " 
              @click="dropObject()"
            >
              Drop
            </li>
            <li v-if="activePanel === 'sharedObjects' 
              && canTakeObject 
              || activePanel === 'backpack'" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Destroy
            </li>
            <li v-if="activePanel === 'sharedObjects' 
              || activePanel === 'backpack'" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Properties
            </li>
            <li v-if="activePanel === 'users'" style="border:inset #EEE 3px;"></li>
            <li v-if="activePanel === 'users'" 
              class="
                flex-none
                p-1
                pl-3.5
                bg-gray-300
                text-gray-500
                hover:text-white 
                hover:bg-gray-500
                active:bg-gray-400
                cursor-pointer
              "
            >
              Request Objects
            </li>
          </ul>
        </div>
        <ul>
          <li v-for="(msg, key) in messages" :key="key">
            <i v-if="msg.new !== true && msg.type !== 'system'" class="text-white">
              {{ msg.username }}: {{ msg.msg }}
            </i>
            <strong
              v-if="msg.msg && msg.type === 'system'"
              class="text-white">
              {{ msg.msg }}
            </strong>
            <strong
              v-else-if="msg.type && msg.type === 'system'"
              class="text-white">
              {{ msg.time }}
            </strong>
            <span 
              v-else-if="msg.username === $store.data.user.username && msg.new === true"
              class="text-yellow-200">
              {{msg.username}}<span
                class="inline" v-show="msg.role"
            >[{{msg.role}}]</span
            >: {{ msg.msg }}
              </span>
            <span v-else-if="msg.new === true">
              {{ msg.username }}<span
                class="inline" v-show="msg.role"
            >[{{msg.role}}]</span
            >: {{ msg.msg }}
            </span>
          </li>
        </ul>
      </div>
      <div
        class="flex flex-none flex-row space-x-0.5 bg-black"
        v-show="connected"
      >
        <input
          type="text"
          v-model="message"
          class="flex-grow p-0.5 text-black"
          @keyup.exact.enter="sendMessage"
          maxlength="255"
        />
        <button
          type="button"
          class="
            flex-none
            p-1
            bg-gray-300
            text-black
            hover:bg-gray-200
            active:bg-gray-400
          "
          @click="sendMessage"
        >
          Send
        </button>
      </div>
    </div>
    <div class="flex flex-none flex-col w-60 space-0.5 bg-black">
      <div
        class="
          flex flex-none
          p-1
          messages-pane
          text-yellow-200 text-center
          font-bold
        "
      >
        <span v-if="activePanel === 'users'" class="flex-grow">
          ({{ this.users.length + 1 }}) {{ this.$store.data.place.name }}
        </span>
        <span v-if="activePanel === 'gestures'" class="flex-grow">
          Body Language
        </span>
        <span v-if="activePanel === 'sharedObjects'" class="flex-grow">
          ({{ sharedObjects.length }}) Objects
        </span>
        <span v-if="activePanel === 'backpack'" class="flex-grow">
          ({{ backbackObjects.length }}) My Backpack
        </span>
        <button
          type="button"
          class="
            flex-none
            p-0.5
            bg-gray-300
            text-black
            hover:bg-gray-200
            active:bg-gray-400
          "
          @click="changeActivePanel()"
        >
          Next
        </button>
      </div>
      <div id="sideBar" class="flex-grow overflow-y-auto p-1 messages-pane" >
        <ul v-if="activePanel === 'users'" >
          <li class="text-white">
            <img src="/assets/img/av_me.gif" class="inline" />
            {{ this.$store.data.user.username }}
          </li>
          <li v-for="(user, key) in users" :key="key" @mouseup.right="userMenu(user.id, user.username)">
              <img src="/assets/img/av_def.gif" class="inline" />
              {{ user.username }}
          </li>
        </ul>
        <ul v-if="activePanel === 'gestures'">
          <li
            v-for="(gesture, key) in this.$store.data.user.avatar.gestures"
            :key="key"
            @click="sendGesture(key)"
            class="cursor-pointer hover:bg-gray-200 active:bg-gray-400"
          >
            {{ gesture }}
          </li>
        </ul>
        <ul v-if="activePanel === 'sharedObjects'">
          <li
            v-for="object in sharedObjects"
            :key="object.id"
            @mouseup.right="userMenu(object.id, activePanel) "
          >
            {{ object.name }}
          </li>
        </ul>
        <ul v-if="activePanel === 'backpack'">
          <li
            v-for="object in backbackObjects"
            :key="object.id"
            class="flex"
            @mouseup.right="userMenu(object.id, activePanel) "
          >
            <div class="flex-1">
              {{ object.name }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>  
</template>

<script lang="ts">
import Vue from 'vue';
import { debugMsg } from '@/helpers';

let numberOfPosts = 0;
let userMenu = null;
var cursorX = null;
var cursorY = null;
let menuData = null;
document.addEventListener('mousemove', onMouseUpdate, false);
document.addEventListener('mouseenter', onMouseUpdate, false);
    
function onMouseUpdate(e) {
  cursorX = e.pageX;
  cursorY = e.pageY;
}
function getCursorX() {
  return cursorX;
}
function getCursorY() {
  return cursorY;
      }

export default Vue.extend({
  name: "Chat",
  props: [
    "place",
    "sharedEvent",
    "sharedObjects",
  ],
  data: () => {
    return {
      message: "",
      messages: [],
      users: [],
      backbackObjects: [],
      primaryRole: "",
      activePanel: "users",
      objectId: null,
      canDropObject: false,
      canTakeObject: false,
      isForSale: false,
    };
  },
  methods: {
    debugMsg,
    async getRole(): Promise<void> {
      const response = await this.$http.get("/member/getrolename");
      this.primaryRole = response.data.PrimaryRoleName[0].name;
    },
    sendMessage(): void {
      this.debugMsg("sending message...");

      //Limits the length of a single word allowed
      const maxWordLength = 24;
      this.message.split(" ").map(word => {
        if(word.length > maxWordLength){
          this.message = "";
          alert ("Please do not try to flood the chat with long words!");
          }
        }
      )

      //Limits the amount of posts allowed within a rolling 30 seconds
      const maxPosts = 7;
      const postInterval = .5;
      if(this.message !== ""){
        if(numberOfPosts === 0 || numberOfPosts <= maxPosts - 1){
            setTimeout(() => numberOfPosts = --numberOfPosts, postInterval * 60 * 1000);
          }
          else{
            alert ("Chat has been temporarily disabled. Please do not flood the chat!");
            this.message = "";
          }
        }

      if (this.message !== "" && this.connected && numberOfPosts < maxPosts) {
        this.$socket.emit("CHAT", {
          msg: this.message,
          role: this.primaryRole,
        });
        this.$http
          .post("/message/place/" + this.$store.data.place.id, {
            body: this.message,
          })
          .then((response) => {
            this.debugMsg(response.data);
          });
        numberOfPosts = ++numberOfPosts;
        this.message = "";
      }
    },
    systemMessage(msg: string): void {
      this.messages.push({
        type: "system",
        msg: msg,
        time: new Date().toLocaleTimeString("en-US", {timeZone: "America/New_York"}),
      });
    },
    preventMenu(){
      let chat = document.getElementById("chat")
      chat.addEventListener("contextmenu", function(e){
        e.preventDefault()
      })
    },
    userMenu(target, username){
      userMenu = document.getElementById('userMenu');
      userMenu.style.display = "block";
      userMenu.style.left = getCursorX() - 15 + "px";
      userMenu.style.top = getCursorY() - 15 + "px";
      menuData = [target,username]
    },
    closeMenu(){
      userMenu = document.getElementById('userMenu');
      userMenu.style.display = "none";
    },
    startNewChat(): void {
      userMenu = document.getElementById('userMenu');
      userMenu.style.display = "none";
      this.messages = [];
      this.users = [];
      this.canDropObject = false;
      this.canTakeObject = false;
      this.isForSale = false;
      this.preventMenu();
      if(
        this.$store.data.place.member_id === this.$store.data.user.id
        && this.$store.data.view3d
        ) {
          this.canDropObject = true;
        }
      if(
        this.$store.data.place.member_id === this.$store.data.user.id ||
        this.sharedObjects.member_id === this.$store.data.user.id
        ) {
          this.canTakeObject = true;
        }
        console.log(this.sharedObjects)
      this.$http
        .get(`/message/place/${this.$store.data.place.id}`, {
          limit: 10,
          order: "id",
          orderDirection: "desc",
        })
        .then((response) => {
          this.messages = response.data.messages.reverse();
          this.systemMessage("Welcome to " + this.$store.data.place.name);
        });
    },
    changeActivePanel(): void {
      switch (this.activePanel) {
        case "users":
          this.activePanel = "gestures";
          break;
        case "gestures":
          this.activePanel = "sharedObjects";
          break;
        case "sharedObjects":
          this.activePanel = "backpack";
          break;
        case "backpack":
          this.activePanel = "users";
          break;
      }
      this.closeMenu();
    },
    sendGesture(gestureIndex): void {
      this.$socket.emit("AV", {
        gesture: gestureIndex + 1, // Gestures in ssts start at 1 for some reason.
      });
    },
    moveObject(): void {
      this.$emit("move-object", menuData[0]);
      this.closeMenu();
    },
    beamTo(): void {
      this.$emit("beam-to", menuData[0]);
      this.closeMenu();
    },
    startSocketListeners(): void {
      this.$socket.on("CHAT", data => {
        this.debugMsg("chat message received...", data);
        this.debugMsg(data);
        this.messages.push(data);
      });
      this.$socket.on("AV:del", event => {
        this.systemMessage(event.username + " has left.");
        this.users = this.users.filter((u) => u.id !== event.id);
      });
      this.$socket.on("AV:new", event => {
        this.systemMessage(event.username + " has entered.");
        this.users.push(event);
      })
      ;
      this.$socket.on("disconnect", () => {
        this.systemMessage("Chat server disconnected. Please refresh to reconnect.");
      });
    },
    dropObject() {
      this.$emit("drop-object", menuData[0]);
      this.closeMenu();
      this.sharedObjects.$forceUpdate();
    }
  },
  watch: {
    place() {
      this.startNewChat();
    },
    messages: {
      handler(newMessages, oldMessages) {
        if (oldMessages.length > 0 && newMessages[0] !== oldMessages[0]) {
        } else {
          const chat = this.$refs.chatArea as Element;
          this.$nextTick(function () {
            chat.scrollTop = chat.scrollHeight;
            setTimeout(() => {
              chat.scrollTop = chat.scrollHeight;
            }, 50);
          });
        }
      },
      deep: true,
    },
    async activePanel() {
      if(this.activePanel === 'backpack') {
        this.backbackObjects = [];
        const response = await this.$http.get("/member/backpack");
        this.backbackObjects = response.data.objects;
      }
    }
  },
  computed: {
    connected: function() { return this.$socket.connected; },
  },
  mounted() {
    this.debugMsg("starting chat page...");
    this.startSocketListeners();
    if (this.$store.data.place) {
      this.startNewChat();
      this.getRole();
      setInterval(this.systemMessage, 5 * 60 * 1000);
    }
  },
});
</script>
