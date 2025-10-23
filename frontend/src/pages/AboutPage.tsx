const AboutPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-2xl text-center p-6 bg-card text-card-foreground shadow-md rounded-2xl border border-border">
        <h1 className="text-3xl font-bold mb-4">About Us</h1>
        <p className="text-lg">
          MovieLily aims to deliver a site where you and your friends can get
          easy recommendations for movies specifically tailored to your own interests!
        </p>
        <img
          src="https://img.freepik.com/free-vector/national-popcorn-day-banner-design_1308-122939.jpg?semt=ais_hybrid&w=740&q=80"
          alt="About us"
          className="mx-auto rounded-lg shadow-md w-50 max-w-sm mt-6"
        />
      </div>
    </div>
  );
};

export default AboutPage;

