import { Service } from 'typedi';

import { 
  ObjectInstanceRepository, 
  WalletRepository, 
  TransactionRepository,
  PlaceRepository,
  MemberRepository } from '../../repositories';
import { ObjectInstancePosition, ObjectInstanceRotation } from 'models';
import { Object } from 'models';

/** Service for dealing with blocks */
@Service()
export class ObjectInstanceService {
  constructor(
    private objectInstanceRepository: ObjectInstanceRepository,
    private walletRepository: WalletRepository,
    private transactionRepository: TransactionRepository,
    private placeRepository: PlaceRepository,
    private memberRepository: MemberRepository) {}

  public async find(objectInstanceId: number): Promise<any> {
    return await this.objectInstanceRepository.find(objectInstanceId);
  }

  public async updateObjectPlacement(
    objectInstanceId: number,
    positionObj: ObjectInstancePosition,
    rotationObj: ObjectInstanceRotation,
  ): Promise<void> {
    const position = JSON.stringify({
      x: Number.parseFloat(positionObj.x),
      y: Number.parseFloat(positionObj.y),
      z: Number.parseFloat(positionObj.z),
    });
    const rotation = JSON.stringify({
      x: Number.parseFloat(rotationObj.x),
      y: Number.parseFloat(rotationObj.y),
      z: Number.parseFloat(rotationObj.z),
      angle: Number.parseFloat(rotationObj.angle),
    });

    return await this.objectInstanceRepository.updateObjectPlacement(
      objectInstanceId,
      position,
      rotation,
    );
  }

  public async countById(objectId: number): Promise<any> {
    return await this.objectInstanceRepository.countByObjectId(objectId);
  }

  public async updateObjectPlaceId(objectInstanceId: number, placeId: number): Promise<void> {
    return await this.objectInstanceRepository.updateObjectPlaceId(objectInstanceId, placeId);
  }

  public async updateObjectInstanceName(objectId,objectName): Promise<any> {
    return await this.objectInstanceRepository.updateObjectInstanceName(
      objectId, objectName);
  }

  public async updateObjectInstancePrice(objectId,objectPrice): Promise<any> {
    return await this.objectInstanceRepository.updateObjectInstancePrice(
      objectId, objectPrice);
  }

  public async updateObjectInstanceBuyer(objectId,objectBuyer): Promise<any> {
    return await this.objectInstanceRepository.updateObjectInstanceBuyer(
      objectId, objectBuyer);
  }

  public async add(object: Partial<Object>, memberId: number): Promise<any> {
    await this.objectInstanceRepository.create(object.id, object.name, memberId, 0);
  }

  public async getObjectInstanceWithObject(objectInstanceId: number): Promise<any> {
    return await this.objectInstanceRepository.getObjectInstanceWithObject(objectInstanceId);
  }

  public async findAllObjectInstances(limit: number, offset: number): Promise<any> {
    const objects = await this.objectInstanceRepository.getAllObjectInstances(limit, offset);
    const returnObjects = [];
    for(const result of objects) {
      if(result.place_id !== 0){
        const placeName = await this.placeRepository.findById(result.place_id);
        result.place_name = placeName.name;
        result.place_type = placeName.type;
      } else {
        result.place_name = 'backpack';
        result.place_type = 'backpack';
      }
      returnObjects.push(result);
    }
    const total = await this.objectInstanceRepository.totalCount();
    return [{object: returnObjects, total:total}]
  }

  public async getOwnedObjects(
    memberId: number, limit: number, offset: number): Promise<any> {
    const objects = await this.objectInstanceRepository
      .searchAllObjectInstances(memberId, limit, offset);
    const returnObjects = [];
    for(const result of objects) {
      if(result.place_id !== 0){
        const placeName = await this.placeRepository.findById(result.place_id);
        result.place_name = placeName.name;
        result.place_type = placeName.type;
      } else {
        result.place_name = 'backpack';
        result.place_type = 'backpack';
      }
      returnObjects.push(result);
    }
    const total = await this.objectInstanceRepository.totalSearchCount(memberId);
    return [{object: returnObjects, total:total}]
  }

  public async buyObjectInstance(objectId: number, buyerId: number): Promise<any> {
    const object = await this.objectInstanceRepository.getObjectInstanceWithObject(objectId);
    const buyer = await this.memberRepository.findById(buyerId);
    const seller = await this.memberRepository.findById(object[0].member_id);
    const sellerWallet = await this.walletRepository.findById(seller.wallet_id);
    const buyerWallet = await this.walletRepository.findById(buyer.wallet_id);

    try{
      if(!object[0].object_price && object[0].object_price !== 0){
        throw new Error('The object is not for sale!');
      }
      if(buyerWallet.balance < object[0].object_price){
        throw new Error('Insufficient funds.');
      }
      if(object[0].object_buyer && 
        buyer.username.toLowerCase() !== object[0].object_buyer.toLowerCase()){
        throw new Error('You are not the buyer that is listed on the object!');
      }
      await this.transactionRepository
        .createObjectSellTransaction(buyerWallet.id, sellerWallet.id, object[0].object_price);
      await this.objectInstanceRepository.updateObjectInstanceOwner(objectId, buyerId);
      return true;
    } catch(error) {
      console.error(error);
    }
  }
}
