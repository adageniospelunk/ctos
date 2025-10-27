module.exports = function(args) {
  if (args.length === 0) {
    console.log('Hello! Please provide a name or number.');
    console.log('Usage: ctosooa hello <name|number>');
    return;
  }

  const input = args[0];
  console.log(`Hello ${input}! Welcome to ctosooa.`);

  // If it's a number, do something special
  if (!isNaN(input)) {
    console.log(`You passed the number: ${input}`);
    console.log(`Double of ${input} is: ${input * 2}`);
  }
};
