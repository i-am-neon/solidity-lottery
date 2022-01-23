const { expect } = require('chai')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised).should()
const BN = require('bn.js')
const skipIf = require('mocha-skip-if')
chai.use(require('chai-bn')(BN))
const fs = require('fs')
const { deployments } = require('hardhat')
const { developmentChains } = require('../helper-hardhat-config')

skip.if(!developmentChains.includes(network.name)).
  describe('Lottery', async function () {
    let contract;
    let signers;

    before(async () => {
      signers = await ethers.getSigners();
    });

    beforeEach(async () => {
      await deployments.fixture(['lottery']);
      const Lottery = await deployments.get("Lottery");
      contract = await ethers.getContractAt("Lottery", Lottery.address);
    })

    it('deploys successfully', async () => {
      const address = contract.address;
      expect(address).to.not.eql(0x0);
      expect(address).to.not.be.empty;
      expect(address).to.not.be.null;
      expect(address).to.not.be.undefined;
    })

    it('enters you into the lottery', async () => {
      await contract.enterInLottery();

      let participant = await contract.participants(0);

      expect(participant).to.eq(signers[0].address);
    });

    it('enters multiple participants into lottery', async () => {
      await contract.enterInLottery();
      await contract.connect(signers[1]).enterInLottery();
      await contract.connect(signers[2]).enterInLottery();
      await contract.connect(signers[3]).enterInLottery();

      let participant0 = await contract.participants(0);
      let participant1 = await contract.participants(1);
      let participant2 = await contract.participants(2);
      let participant3 = await contract.participants(3);

      expect(participant0).to.eq(signers[0].address);
      expect(participant1).to.eq(signers[1].address);
      expect(participant2).to.eq(signers[2].address);
      expect(participant3).to.eq(signers[3].address);
    });

    it('gets number of participants', async () => {
      await contract.enterInLottery();
      await contract.connect(signers[1]).enterInLottery();
      await contract.connect(signers[2]).enterInLottery();
      await contract.connect(signers[3]).enterInLottery();

      const participantCount = await contract.getParticipantCount();

      expect(participantCount).to.eq(4);
    });

    it('onlyOwner can call chooseWinner()', async () => {
      enterAllTenSignersIntoLottery(signers, contract);

      expect(await contract.chooseWinner()).to.be.an('string');
      await contract.connect(signers[1]).chooseWinner().should.be.rejected;
    });

    it('onlyOwner can set minimum participants', async () => {
      await contract.setMinimumParticipants(5);
      await contract.connect(signers[1]).setMinimumParticipants(5).should.be.rejected;
    });

    it('can get minimum participants', async () => {
      await contract.setMinimumParticipants(15);

      const minimumParticipants = await contract.minimumParticipants();

      expect(minimumParticipants).to.eq(15);
    });

    it('should fail to choose winner when there are NOT enough participants', async () => {
      await contract.setMinimumParticipants(1);

      await contract.chooseWinner().should.be.rejected;
    });

    it('should choose winner when there are enough participants', async () => {
      // const minimumParticipants = await contract.minimumParticipants();
      await contract.setMinimumParticipants(9);
      await enterAllTenSignersIntoLottery(signers, contract);

      const winner = await contract.chooseWinner();
      const addresses = signers.map((signer) => signer.address);

      expect(addresses).to.include(winner);
    });
  });

async function enterAllTenSignersIntoLottery(signers, contract) {
  signers.forEach(async signer => {
    await contract.connect(signer).enterInLottery();
  });
}