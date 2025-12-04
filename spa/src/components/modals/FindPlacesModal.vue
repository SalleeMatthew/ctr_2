<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
        <button type="button" class="btn-ui-inline" @click="openHowDoIModal"><</button>
    </template>
    <template v-slot:body>
        <div>
          <h3 align="center">Find Places</h3>
        </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

import HowDoIModal from './HowDoIModal.vue';

export default Vue.extend({
  name: "FindPlacesModal",
  components: {Modal},
  methods: {
    openHowDoIModal(): void {
      ModalService.open(HowDoIModal);
    },
  },
  mixins: [ModalMixin],
});
</script>
