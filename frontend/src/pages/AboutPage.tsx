
const AboutPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-2xl text-center p-6 bg-white shadow-md rounded-2xl">
        <h1 className="text-3xl font-bold mb-4">About Us</h1>
        <p className="text-gray-700 text-lg">
          ASD Movies aim to deliver a site in which you and your friends can get
          easy recommendations for movies specifically tailored to you own interests!

        </p>
        <img
          src="https://img.freepik.com/free-vector/national-popcorn-day-banner-design_1308-122939.jpg?semt=ais_hybrid&w=740&q=80"
          alt="About us"
          className="mx-auto rounded-lg shadow-md w-50 max-w-sm"
        />
      </div>
    </div>
  );
};

export default AboutPage;
