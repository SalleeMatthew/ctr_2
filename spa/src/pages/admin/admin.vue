<template>
<main class="flex w-full h-full">
  <div class="flex-col w-56 h-full border-r-2 border-white text-center">
    <div class="pt-3">Admin Panel</div>
    <div class="p-3"><hr></div>
    <div class="mb-2"><router-link class="btn-ui" :to="{name: 'UserSearch'}">Members</router-link></div>
    <div class="mb-2"><router-link class="btn-ui" :to="{name: 'PlaceSearch'}">Places</router-link></div>
    <div class="mb-2"><router-link class="btn-ui" :to="{name: 'AvatarSearch'}">Avatars</router-link></div>
  </div>
  <div class="w-11/12 h-full p-1 overflow-y-scroll"><router-view :accessLevel="accessLevel" /></div>
</main>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "admin",
  data: () => {
    return {
      accessLevel: "none",
    };
  },
  methods: {
    async getAdminLevel(): Promise<void> {
      try{
        await this.$http.get("/member/getadminlevel")
          .then((response) => {
            this.accessLevel = response.data.accessLevel;
            if (this.accessLevel === "none"){
              this.$router.push({name: "restrictedaccess"});
            }
          });
      } catch (e) {
        console.log(e);
      }
    },
  },
  created() {
    this.getAdminLevel();
  },
});
</script>
