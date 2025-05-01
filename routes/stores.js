
const express = require("express");
const auth = require("../middleware/auth");
const MedicalStore = require("../modals/MedicalStore");
const User = require("../modals/User");
const router = express.Router();

// Add store (Admin or Store Owner)
router.post("/", auth(["admin", "store_manager"]), async (req, res) => {
  const { name, address, contact, location, medicines, certificateNumber } = req.body;
const findCert= await MedicalStore.find({certificateNumber});
if(findCert.length>0) {
  return res.status(405).json({message: "duplicate certificate number"});
}

  try {
    const storeData = {
      name,
      address,
      contact,
      certificateNumber,
      location: {
        type: "Point",
        coordinates: location.coordinates || [0, 0],
      },
      medicines,
    };

    if (req.user.role === "admin") {
      storeData.adminId = req.user.id;
    } else if (req.user.role === "store_manager") {
      storeData.ownerId = req.user.id;
    }

    const store = new MedicalStore(storeData);
    await store.save();

    // If store owner, link store to user
    if (req.user.role === "store_manager") {
      await User.findByIdAndUpdate(req.user.id, { storeId: store._id });
    }
    
    res.status(201).json(store);
  } catch (err) {
    console.log("err", err)
    res.status(500).json({ msg: "Server error || duplicate certificate number" });
  }
});

// Update delivery status
router.patch('/:id/delivery', auth(['admin', 'store_manager']), async (req, res) => {
  try {
    const store = await MedicalStore.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ adminId: req.user.id }, { ownerId: req.user.id }]
      },
      { deliveryAvailable: req.body.deliveryAvailable },
      { new: true }
    );
    
    if (!store) return res.status(404).json({ msg: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get("/my-stores", auth(["admin", "store_manager"]), async (req, res) => {
  try {
    let query = {};
console.log("my-stores", req.user)
    if (req.user.role === "admin") {
      query.adminId = req.user.id;
    } else if (req.user.role === "store_manager") {
      query.ownerId = req.user.id;
    }

    const stores = await MedicalStore.find(query);
    res.json(stores);
  } catch (err) {
    console.error("Error fetching user stores:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// Update store status (Admin or Store Owner)
router.patch("/:id/status", auth(["admin", "store_manager"]), async (req, res) => {
  try {
    const store = await MedicalStore.findOne({
      _id: req.params.id,
      $or: [{ adminId: req.user.id }, { ownerId: req.user.id }],
    });

    if (!store) return res.status(404).json({ msg: "Store not found" });

    store.status = req.body.status;
    await store.save();

    res.json(store);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


// @route   DELETE api/stores/:id
// @desc    Delete store
router.delete('/:id', auth(['admin', 'store_manager']), async (req, res) => {
  try {
    const store = await MedicalStore.findOne({
      _id: req.params.id,
      $or: [{ adminId: req.user.id }, { ownerId: req.user.id }]
    });

    if (!store) return res.status(404).json({ msg: 'Store not found' });

    await store.deleteOne();
    res.json({ msg: 'Store removed' });
  } catch (err) {
    console.log("err",  err)
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all stores (Public)
router.get("/", async (req, res) => {
  try {
    const stores = await MedicalStore.find();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


// // Get all stores (Public) with pagination
// router.get("/", async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     const skip = (page - 1) * limit;

//     const [stores, total] = await Promise.all([
//       MedicalStore.find().skip(skip).limit(limit),
//       MedicalStore.countDocuments()
//     ]);

//     res.json({
//       stores,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       totalItems: total
//     });
//   } catch (err) {
//     res.status(500).json({ msg: "Server error" });
//   }
// });



// Update entire store (Admin or Store Owner)
router.put('/:id', auth(['admin', 'store_manager']), async (req, res) => {
  const { name, address, contact, location, medicines, deliveryAvailable, operatingHours } = req.body;

  try {
    const store = await MedicalStore.findOne({
      _id: req.params.id,
      $or: [{ adminId: req.user.id }, { ownerId: req.user.id }]
    });

    if (!store) return res.status(404).json({ msg: 'Store not found or access denied' });

    // Update allowed fields
    if (name) store.name = name;
    if (address) store.address = address;
    if (contact) store.contact = contact;
    if (location && location.coordinates) {
      store.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }
    if (Array.isArray(medicines)) store.medicines = medicines;
    if (typeof deliveryAvailable === 'boolean') store.deliveryAvailable = deliveryAvailable;
    if (operatingHours) store.operatingHours = operatingHours;

    store.updatedAt = new Date();

    await store.save();
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;