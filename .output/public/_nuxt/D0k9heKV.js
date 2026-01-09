import{_ as k}from"./B5frNqD5.js";import{u as g,e as p,f as S,g as y,c as h,a as r,b as N,i as _,o as w}from"./CdtAEXek.js";import{u as F}from"./DsidGJoe.js";import"./BiSYcTYW.js";import"./BDBL0v1s.js";var m={kind:"Document",definitions:[{kind:"OperationDefinition",operation:"query",name:{kind:"Name",value:"allGamesQuery"},variableDefinitions:[],directives:[],selectionSet:{kind:"SelectionSet",selections:[{kind:"Field",name:{kind:"Name",value:"gameCollection"},arguments:[{kind:"Argument",name:{kind:"Name",value:"limit"},value:{kind:"IntValue",value:"999"}},{kind:"Argument",name:{kind:"Name",value:"order"},value:{kind:"ListValue",values:[{kind:"EnumValue",value:"title_ASC"}]}}],directives:[],selectionSet:{kind:"SelectionSet",selections:[{kind:"Field",name:{kind:"Name",value:"items"},arguments:[],directives:[],selectionSet:{kind:"SelectionSet",selections:[{kind:"Field",name:{kind:"Name",value:"title"},arguments:[],directives:[]},{kind:"Field",name:{kind:"Name",value:"slug"},arguments:[],directives:[]},{kind:"Field",name:{kind:"Name",value:"system"},arguments:[],directives:[],selectionSet:{kind:"SelectionSet",selections:[{kind:"Field",name:{kind:"Name",value:"slug"},arguments:[],directives:[]},{kind:"Field",name:{kind:"Name",value:"shortName"},arguments:[],directives:[]}]}},{kind:"Field",name:{kind:"Name",value:"playedStatus"},arguments:[],directives:[]},{kind:"Field",name:{kind:"Name",value:"digital"},arguments:[],directives:[]},{kind:"Field",name:{kind:"Name",value:"wtbWts"},arguments:[],directives:[]},{kind:"Field",name:{kind:"Name",value:"region"},arguments:[],directives:[]}]}}]}}]}}],loc:{start:0,end:288}};m.loc.source={body:`# TODO: Paginate instead of 999 limit\r
query allGamesQuery {\r
  gameCollection(limit: 999, order: [title_ASC]) {\r
    items {\r
      title\r
      slug\r
      system {\r
        slug\r
        shortName\r
      }\r
      playedStatus\r
      digital\r
      wtbWts\r
      region\r
    }\r
  }\r
}\r
`,name:"GraphQL request",locationOffset:{line:1,column:1}};function u(e,n){if(e.kind==="FragmentSpread")n.add(e.name.value);else if(e.kind==="VariableDefinition"){var i=e.type;i.kind==="NamedType"&&n.add(i.name.value)}e.selectionSet&&e.selectionSet.selections.forEach(function(t){u(t,n)}),e.variableDefinitions&&e.variableDefinitions.forEach(function(t){u(t,n)}),e.definitions&&e.definitions.forEach(function(t){u(t,n)})}var d={};(function(){m.definitions.forEach(function(n){if(n.name){var i=new Set;u(n,i),d[n.name.value]=i}})})();function f(e,n){for(var i=0;i<e.definitions.length;i++){var t=e.definitions[i];if(t.name&&t.name.value==n)return t}}function G(e,n){var i={kind:e.kind,definitions:[f(e,n)]};e.hasOwnProperty("loc")&&(i.loc=e.loc);var t=d[n]||new Set,o=new Set,l=new Set;for(t.forEach(function(a){l.add(a)});l.size>0;){var c=l;l=new Set,c.forEach(function(a){if(!o.has(a)){o.add(a);var s=d[a]||new Set;s.forEach(function(v){l.add(v)})}})}return o.forEach(function(a){var s=f(e,a);s&&i.definitions.push(s)}),i}G(m,"allGamesQuery");const D={class:"container"},C={__name:"index",async setup(e){let n,i;g({title:"Gloves Off Games - Games"});const{$graphql:t}=p(),{data:o}=([n,i]=S(()=>F("allGames",()=>t.request(m))),n=await n,i(),n),l=y(()=>o.value?.gameCollection?.items||[]);return(c,a)=>{const s=k;return w(),h("main",null,[r("div",D,[r("div",null,[r("div",null,[a[0]||(a[0]=r("h1",null,"Games",-1)),a[1]||(a[1]=r("p",null,"Like, literally all my games.",-1)),a[2]||(a[2]=r("hr",null,null,-1)),N(s,{games:_(l)},null,8,["games"])])])])])}}};export{C as default};
