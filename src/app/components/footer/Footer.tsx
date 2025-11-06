import Link from "next/link"
import React from "react"

function Footer() {
  return (
    <footer className="bg-blue-700 border-t border-gray-200 pt-6 pb-6 px-[40px] text-center flex flex-col gap-2 items-center">
    <img src="/logo/cosci-hub-footer.png" alt="coscihub" className="w-[136px]"/>    
    <p className="text-xs text-white">© 2025 COSCI Hub, College of Social Communication Innovation Srinakharinwirot University.</p>
    <p className="text-xs text-white">EMAIL. COSCI_HUB@gmail.com</p>
  </footer>
  )
}
export default Footer