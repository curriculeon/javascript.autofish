function test(expectedOutput, invoker, func, ...args) {
  let output;
  try {
    console.log(`Testing \`${func.name}\``);
    output = func.bind(invoker)(...args);
  } catch(err){}
  console.log(`arguments: ${args}`);
  const pass = output === expectedOutput;
  console.log(`output = \n${output}`);
  console.log(`expected = \n${expectedOutput}`);
  console.log(`test pass = ${pass}`);
  console.log("------------------------------------");
  console.log("------------------------------------");
}


function testFunction(expectedOutput, func, ...args) {
  let output;
  try {
    console.log(`Testing \`${func.name}\``);
    output = func(...args);
  } catch(err){}
  console.log(`arguments: ${args}`);
  const pass = output === expectedOutput;
  console.log(`output = \n${output}`);
  console.log(`expected = \n${expectedOutput}`);
  console.log(`test pass = ${pass}`);
  console.log("------------------------------------");
  console.log("------------------------------------");
}
