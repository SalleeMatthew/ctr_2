<template>
	<div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
    <div class="text-red-500" v-show="error">{{ error }}</div>
    <div class="text-center w-full text-5xl mb-1">Mall Warehouse</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div v-if="totalCount !== 0">
        Sort By:
        <select v-model="orderBy" @change="setLimit"> 
          <option value="ASC">Oldest First</option>
          <option value="DESC">Newest First</option>
        </select>
      </div>
      <div v-if="totalCount !== 0">
        View Amount:
        <select v-model.number="limit" @change="setLimit">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
    <div v-if="totalCount !== 0" class="grid-cols-1 w-4/6 justify-items-center text-center ">
      Total Count: {{ totalCount }}
    </div>
    <span v-if="pages.length > 1">Pages</span>
    <div v-if="pages.length > 1" class="flex w-full justify-center font-bold">
      <span class="flex justify-center" v-for="page in pages" :value="page">
        <span class="p-2" v-if="pageNum === page">{{ page }}</span>
        <span class="p-2 cursor-pointer" style="color:lime;" v-else-if="page > (pageNum - 5) && page < (pageNum + 5)" @click="setPageNumber(page)">{{ page }}</span>
      </span>
      <span class="p-2 font-bold" style="color:lime;" v-if="(pageNum + 5) <= pages.length">. . .</span>
    </div>
    <div v-if="totalCount === 0">No items to show</div>
    <div v-else>
      <div class="flex" style="margin-bottom: 2rem;" v-for="object in objects"
            :key="object.id">
        <div class="w-full flex border">
          <div>
            <div class="flex justify-center" style="min-width:250px;min-height:250px;">
              <img :src="'/assets/object/'+object.directory + '/' + object.image" 
                    style="max-width:250px;max-height:250px;height:auto;width:auto;"
                  />
            </div>
          </div>
          <div class="w-80">
            <div class="flex"><div class="w-24">Name: </div><div>{{ object.name }}</div></div>
            <div class="flex"><div class="w-24">Price: </div><div>{{ object.price }}</div></div>
            <div class="flex" v-if="object.instances >= 1"><div class="w-24">Sold: </div><div>{{ object.instances }}</div></div>
            <div class="flex"><div class="w-24">Quantity: </div><div>{{ object.quantity }}</div></div>
            <div class="flex">
              <div class="w-24">Limit: </div>
              <div v-if="object.limit">{{ object.limit }}</div>
              <div v-else>Unlimited</div>
            </div>
            <div class="flex"><div class="w-24">Created By: </div><div>{{ object.username }}</div></div>
          </div>
          <div>
            <div class="w-40">
              <button class="btn-ui" @click="updateName(object.id, object.name)">Edit Name</button>
              <button class="btn-ui" @click="updateLimit(object.id, object.quantity)">Update Limit</button>
              <button class="btn-ui" @click="refundUnsoldQuantity(object.id)">Destock</button>
            </div>
          </div>
          <div>
            <div>
              Select a Store:<br />
              <select v-model="store">
                <option v-for="option in mallStoreData" :value="option.id">
                  {{ option.title }}
                </option>
              </select>
              <br /><br />
            </div>
            <button class="btn-ui" @click="drop(object.id)">Drop</button>
          </div>
        </div>
      </div>
    </div>
    <div class="flex w-full justify-center">
      <div class="flex justify-center">
        <div class="p-1 text-right w-full" v-if="pageNum > 1">
          <button class="btn" @click="back">
            BACK
          </button>
        </div>
        <div class="p-1 w-full" v-if="totalCount - offset > limit">
          <button class="btn" @click="next">
            NEXT
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallWarehouse",
  data: () => {
    return {
      canAdmin: false,
      objects: [],
      showError: false,
      error: '',
      success: '',
      showSuccess: false,
      loaded: false,
      totalCount: 0,
      limit: 10,
      offset: 0,
      orderBy: 'ASC',
      showNext: true,
      pageNum: 1,
      pages: [],
      column: 'status',
      compare: '=',
      content: 3,
      store: null,
      mallStoreData: [],
    };
  },
  methods: {
    async isMallStaff() {
      try {
        await this.$http.get(
          `/mall/can_admin`,
        );
        this.canAdmin = true;
      } catch (e) {
        console.log(e);
      }
    },
    setLimit(){
      this.offset = 0;
      this.pageNum = 1;
      this.getResults();
    },
    setPageNumber(value){
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      this.getResults();
    },
    async getResults(): Promise<void> {
      this.objects = [];
      this.pages = [];
      try {
        const response = await this.$http.get(`/mall/all_objects`,
        {
          column: this.column,
          compare: this.compare,
          content: this.content,
          limit: this.limit,
          offset: this.offset,
          orderBy: this.orderBy,
        }
        );
        this.totalCount = response.data.objects.total[0].count;
        this.objects = response.data.objects.objects;
        this.showSuccess = true;
        let pages = Math.ceil(this.totalCount/this.limit);
        for(let i = 1; pages >= i; i++){
          this.pages.push(i);
        }
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }
    },
    async getStores(){
      const stores = await this.$http.get(`/mall/stores`);
      stores.data.stores.forEach(store => {
        this.mallStoreData.push({
          title: store.name,
          id: store.id
        })
      })
    },
    async updateLimit(objectId, quantity): Promise<void>{
      this.showSuccess = false;
      this.showError = false;
      let limit = prompt("Update limit to this object\n NOTE: Setting the limit to 0 makes it Unlimited\n");
      if(limit !== limit.replace(/[^0-9]/g, '')){
        this.error = "Use whole numbers only!";
        return
      }
      if(limit >= '1' && limit < quantity){
        this.error = "Limit cannot be less than the uploaded quantity."
        return
      }
      if(limit !== null && limit !=='' && limit >= quantity ||
        limit !== null && limit !=='' && limit === '0'
      ){
        try {
            this.error = '';
            this.showError = false;
            await this.$http.post("/mall/limit", {
            'objectId': objectId,
            'limit': limit.replace(/[^0-9]/g, ''),
            });
            this.success = 'Object limit updated!';
            this.showSuccess = true;
            this.getResults();
          } catch (errorResponse: any) {
            if (errorResponse.response.data.error) {
              this.error = errorResponse.response.data.error;
              this.showError = true;
            } else {
              this.error = "An unknown error occurred";
              this.showError = true;
            }
          }
      }
    },
    async updateName(objectId, name): Promise<void>{
      this.showSuccess = false;
      this.showError = false;
      let newName = prompt("Current Name:\n " + name + "\n\nNew Name:", name);
      if(newName !== null && newName !==''){
        try {
            this.error = '';
            this.showError = false;
            await this.$http.post("/mall/updateObjectName", {
            'objectId': objectId,
            'name': newName,
            });
            this.success = 'Object name updated!';
            this.showSuccess = true;
            this.getResults();
          } catch (errorResponse: any) {
            if (errorResponse.response.data.error) {
              this.error = errorResponse.response.data.error;
              this.showError = true;
            } else {
              this.error = "An unknown error occurred";
              this.showError = true;
            }
          }
      }
    },
    async refundUnsoldQuantity(objectId): Promise<void> {
      try {
        this.error = '';
        this.showError = false;
        await this.$http.post("/mall/refund", {
        'id': objectId,
        });
        this.success = 'Object updated to deleted status.';
        this.showSuccess = true;
        this.getResults();
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }

    },
    async drop(objectId): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      try {
        if(!this.store){
          this.error = 'You must select a store!';
          this.showError = true;
        } else {
          this.error = '';
          this.showError = false;
          await this.$http.post("/mall/drop", {
          'objectId': objectId,
          'shopId': this.store
          }).then((response) => {
            if(response.data.status === 'success'){
              this.success = 'Object dropped';
              this.showSuccess = true;
              this.store = null;
            }
          });
        }
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      } finally {
        await this.getResults();
      }
    },
    async next() {
      this.offset = this.pageNum * this.limit;
      this.pageNum++
      await this.getResults();
    },
    async back() {
      this.pageNum--
      this.offset = this.pageNum * this.limit - this.limit;
      await this.getResults();
      this.showNext = true;
    },
  },
	async mounted(): Promise<void> {
    this.loaded = true;
    this.isMallStaff();
    this.getStores();
    this.getResults();  
  },
});
</script>
