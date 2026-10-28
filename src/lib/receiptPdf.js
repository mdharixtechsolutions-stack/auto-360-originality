import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateCustomerReceiptPDF = (receiptData, businessProfile = {}) => {
  const doc = new jsPDF();

  const drawPDFContent = (logoImgData = null, signatureImgData = null) => {
    // 1. HEADER SECTION
    doc.setFont("Helvetica", "bold");
    if (logoImgData) {
      try {
        doc.addImage(logoImgData, "PNG", 20, 10, 18, 18);
      } catch (e) {
        console.error("Error adding logo image to PDF", e);
      }
    }

    const hasLogo = !!logoImgData;
    const textStartX = hasLogo ? 43 : 20;

    // Company Name
    const compName = businessProfile?.companyName || "AUTO 360 CONSULTANCY";
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(compName.toUpperCase(), textStartX, 16);

    // Subtitle / Address info
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100);

    const subLines = [];
    if (businessProfile?.address) subLines.push(businessProfile.address);
    if (businessProfile?.mobileNumber) subLines.push(`Mob: ${businessProfile.mobileNumber}`);
    if (businessProfile?.email) subLines.push(`Email: ${businessProfile.email}`);
    if (businessProfile?.website) subLines.push(`Web: ${businessProfile.website}`);
    if (businessProfile?.gstNumber) subLines.push(`GSTIN: ${businessProfile.gstNumber}`);
    if (businessProfile?.cin) subLines.push(`CIN: ${businessProfile.cin}`);

    if (subLines.length === 0) {
      subLines.push("Premium Pre-owned Vehicles & Consultancy Services");
    }

    const addressLineText = subLines.join(" | ");
    const splitAddress = doc.splitTextToSize(addressLineText, 185 - textStartX);
    doc.text(splitAddress, textStartX, 22);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 31, 190, 31);

    // Title
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(receiptData.receiptTitle || "CUSTOMER TRANSACTION RECEIPT", 20, 43);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Receipt No: ${receiptData.receiptNo || receiptData.id || "REC-01"}`, 20, 50);
    doc.text(`Date: ${receiptData.date || receiptData.paymentDate || new Date().toISOString().split("T")[0]}`, 190, 50, { align: "right" });

    // Customer & Vehicle Info
    doc.setFontSize(10.5);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Customer Profile", 20, 62);
    doc.line(20, 65, 95, 65);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Name: ${receiptData.customerName || receiptData.partyName || "-"}`, 20, 71);
    doc.text(`Mobile: ${receiptData.customerMobile || receiptData.mobile || receiptData.phone || "-"}`, 20, 76);

    doc.setFontSize(10.5);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Vehicle Overview", 115, 62);
    doc.line(115, 65, 190, 65);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Vehicle: ${receiptData.vehicleName || "-"}`, 115, 71);
    doc.text(`Reg No: ${receiptData.regNo || receiptData.reg_no || "-"}`, 115, 76);

    // Receipt Table Details (NO vehicle expense, NO consultancy expense, NO purchase cost, NO internal profit/accounting!)
    const sellingPrice = Number(receiptData.sellingPrice || receiptData.totalPrice || 0);
    const advanceAmount = Number(receiptData.advanceAmount || 0);
    const receivedAmount = Number(receiptData.receivedAmount || receiptData.amountPaid || advanceAmount || 0);
    const balanceAmount = Number(receiptData.balanceAmount !== undefined ? receiptData.balanceAmount : Math.max(0, sellingPrice - advanceAmount));
    const paymentMode = receiptData.paymentMode || receiptData.mode || "Cash";
    const refNo = receiptData.referenceNo || receiptData.refNo || receiptData.financeRef || "-";
    const remarks = receiptData.remarks || receiptData.narration || "-";

    const tableBody = [];
    if (sellingPrice > 0) {
      tableBody.push(["Selling Price", `INR ${sellingPrice.toLocaleString("en-IN")}`]);
    }
    if (advanceAmount > 0) {
      tableBody.push(["Advance Booking Amount", `INR ${advanceAmount.toLocaleString("en-IN")}`]);
    }
    tableBody.push(["Received Amount", `INR ${receivedAmount.toLocaleString("en-IN")}`]);
    tableBody.push(["Remaining Balance Due", `INR ${balanceAmount.toLocaleString("en-IN")}`]);
    tableBody.push(["Payment Mode", paymentMode]);
    tableBody.push(["Reference Number", refNo]);
    if (remarks && remarks !== "-") {
      tableBody.push(["Remarks", remarks]);
    }

    autoTable(doc, {
      startY: 83,
      head: [["Particulars", "Details / Value"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: "bold" },
        1: { cellWidth: 60, halign: "right" }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Amount Received: INR ${receivedAmount.toLocaleString("en-IN")}`, 190, finalY, { align: "right" });

    // Terms
    if (businessProfile?.termsAndConditions) {
      doc.setFontSize(7.5);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("TERMS & CONDITIONS", 20, finalY + 10);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(110);
      const termsLines = doc.splitTextToSize(businessProfile.termsAndConditions, 170);
      doc.text(termsLines, 20, finalY + 14);
    }

    // Signature Block
    const sigY = Math.max(finalY + 35, 230);
    doc.setDrawColor(226, 232, 240);
    if (signatureImgData) {
      try {
        doc.addImage(signatureImgData, "PNG", 140, sigY - 14, 32, 11);
      } catch (e) {
        console.error("Error adding signature image to PDF", e);
      }
    }
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Authorized Signature`, 140, sigY);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(`Generated via ${businessProfile?.companyName || "Auto 360 Consultancy"}`, 140, sigY + 4);

    doc.save(`Receipt_${receiptData.receiptNo || receiptData.id || "Sales"}.pdf`);
  };

  const logoUrl = businessProfile?.companyLogo;
  const sigUrl = businessProfile?.authorizedSignature;

  const loadImage = (url) => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  Promise.all([loadImage(logoUrl), loadImage(sigUrl)]).then(([logoImgData, sigImgData]) => {
    drawPDFContent(logoImgData, sigImgData);
  });
};
