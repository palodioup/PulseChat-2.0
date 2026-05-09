import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="text-center m-5 ">
        <h1 className="text-7xl tracking-tighter font-small">
          Seamlessly <span className="text-pink-500">chat</span> with{" "}
          <span className="text-cyan-500">friends</span> like never before.
        </h1>
        <div className="relative z-10">
          <div className="flex justify-center items-center">
            <button
            onClick={() => navigate("/signup")}
            className="border-2 border-cyan-500 rounded-lg p-4 m-4 w-32 transition-all duration-300 hover:scale-105 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            > 
            Get Started
            </button>

            <button
              onClick={() => navigate("/login")}
              className="border-2 border-pink-500 rounded-lg p-4 m-4 w-32 transition-all duration-300 hover:scale-105 hover:bg-pink-500/10 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]"
            >
            Login
            </button>
         </div>
      </div>
      </div>
      
      
    </div>
  );
}
