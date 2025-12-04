<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
        <div>
          <h3 align="center">How Do I?</h3>
          <div align="center">
            <table>
              <tr>
                <td width=200 align=center>
                  <a href="#" @click.prevent="openFindPlacesModal">
                    <img src="/assets/img/icon_myinfo.jpg" border=0><br><b>Find Places</b>
                  </a>
                </td>
              </tr>
            </table>
          </div>
        </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

import FindPlacesModal from './FindPlacesModal.vue';

export default Vue.extend({
  name: "HowDoIModal",
  components: {Modal},
  methods: {
    openFindPlacesModal(): void {
      ModalService.open(FindPlacesModal);
    },
  },
  mixins: [ModalMixin],
});
</script>
