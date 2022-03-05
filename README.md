# Token Auras
A [FoundryVTT](https://foundryvtt.com) module for configuring token auras. Auras are visual only, but should work in any system and can be used as a basis to build more advanced features on top of. The module adds configuration options for up to two auras to the token configuration dialog, and additional auras can be added programmatically, with no limit.

Expanded on work done by [Kim Mantas](https://bitbucket.org/Fyorl/token-auras).

![Example token configuration](https://github.com/crcroberts/radial-token-auras/blob/master/example-config.jpg)

![Example aura visuals](https://github.com/crcroberts/radial-token-auras/blob/master/example-aura.jpg)



## API

Aura objects have the following properties:
```js
{
    angle: number, // The angle (in degrees) for the aura to occupy. The semicircular aura is centered on a position directly to the tokens 'south', and rotates with the token
    distance: number|null, // The radius (in grid units) of the aura.
    colour: string, // An HTML hexadecimal colour.
    opacity: number, // The opacity of the aura between 0 and 1.
    permission: string, // The permission level required to see this aura.
    uuid: string // A unique identifier for every aura.
}
```

A new aura can be created with:
```js
Auras.newAura();
```

### Examples
Programmatically edit the radius of an aura to be `10` grid units:
```js
token.setFlag('token-auras', 'aura1.distance', 10);
```

The UI-configurable auras are stored in `aura1` and `aura2`, but additional auras can be added by adding to the `auras` array:
```js
const auras = duplicate(token.getFlag('token-auras', 'auras'));
const newAura = Auras.newAura();
newAura.distance = 15;
newAura.colour = '#ff0000';
auras.push(newAura);
token.setFlag('token-auras', 'auras', existingAuras);
```
