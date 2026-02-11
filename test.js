const business = require('./business')

async function test() {
    let r = await business.updateCapacity('INFS2201', 3)
    let z = await business.updateCapacity('INFS2201', 3)
    console.log(r)
}
    

test()
