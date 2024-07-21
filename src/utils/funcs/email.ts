import { ICustomer } from "../../models/Customer";
import { MailTypes, sendEmail } from '../../middleware'
import { parseAndCommaJoin } from "./strings";

export const sendConsultationEmail = (customer: ICustomer) => {
  try {
    if (customer) {
      const {
        firstname,
        lastname,
        email,
        phone_number,
        age,
        sex,
        height,
        weight,
        occupation,
        acute_pain_type,
        pain_summary,
        pain_degree,
        pain_duration,
        activity_level,
        pain_areas,
        pain_start_type,
        pain_start_causes,
        physical_therapy_history,
        offered_spinal_surgery,
        spine_imaging_types,
        previous_spinal_surgery,
        limb_weakness_numbness,
        walking_unsteadiness,
        offered_procedure,
        offered_by,
        discussed_result,
        surgery_type,
        surgery_date_time,
        surgeon,
        hand_object_manipulation_problem,
        past_pain_medication,
        current_pain_medication,
        painful_activities,
        painful_leg_activities,
        helpful_activities,
        unoperational_due_to_pain,
        physician_visit_for_pain,
        injection_procedure_for_pain,
        injection_types,
        injection_relief,
        helpful_injection,
        injection_relief_duration,
        medical_problem,
        current_medication
      } = customer

      const painSummaryString = parseAndCommaJoin(pain_summary)
      const painAreasString = parseAndCommaJoin(pain_areas)
      const painStartCausesString = parseAndCommaJoin(pain_start_causes)
      const spineImagingTypesString = parseAndCommaJoin(spine_imaging_types);
      const painfulActivitiesString = parseAndCommaJoin(painful_activities);
      const painfulLegActivitiesString = parseAndCommaJoin(painful_leg_activities)
      const helpfulActivitiesString = parseAndCommaJoin(helpful_activities)
      const injectionTypesString = parseAndCommaJoin(injection_types)

      sendEmail({
        mailType: MailTypes.APPT_REQUESTED,
        from: {
          email: email,
          name: `${firstname} ${lastname}`
        },
        html: `<p>Greetings POMS Doctor,<br/><br/>
          Great News!! You have received a new customer request for a second opinion. All of the information you need to begin has been provided below to allow you to decide if they are an ideal candidate for your second opinion.<br/><br/>
          <b>Name: </b>${firstname} ${lastname}<br/>
          <b>Email: </b>${email}<br/>
          <b>Phone Number: </b>${phone_number}<br/>
          <b>Age: </b>${age}<br/>
          <b>Sex: </b>${sex}<br/>
          <b>Height: </b>${height}<br/>
          <b>Weight: </b>${weight}<br/>
          <b>Occupation: </b>${occupation}<br/>
          <b>Activity Level: </b>${activity_level}<br/><br/>

          <b>Acute Pain Type: </b>${acute_pain_type}<br/>
          <b>Pain Summary: </b>${painSummaryString}<br/>
          <b>Pain Degree: </b>${pain_degree}<br/>
          <b>Pain Duration: </b>${pain_duration}<br/>
          <b>Pain Areas: </b>${painAreasString}<br/>
          <b>Pain Start Type: </b>${pain_start_type}<br/>
          <b>Pain Start Causes: </b>${painStartCausesString}<br/><br/>

          <b>Physical Therapy History: </b>${physical_therapy_history}<br/>
          <b>Previous Spinal Surgery: </b>${previous_spinal_surgery}<br/>
          <b>Offered Spinal Surgery: </b>${offered_spinal_surgery}<br/>
          <b>Offered Procedure: </b>${offered_procedure}<br/>
          <b>Offered By: </b>${offered_by}<br/><br/>

          <b>Limb Weakness Numbness: </b>${limb_weakness_numbness}<br/>
          <b>Walking Unsteadiness: </b>${walking_unsteadiness}<br/>
          <b>Hand Object Manipulation Problem: </b>${hand_object_manipulation_problem}<br/><br/>

          <b>Results Discussed: </b>${discussed_result}<br/>
          <b>Surgery Type: </b>${surgery_type}<br/>
          <b>Surgery Date: </b>${surgery_date_time}<br/>
          <b>Surgeon: </b>${surgeon}<br/>
          <b>Spine Imaging Types: </b>${spineImagingTypesString}<br/><br/>

          <b>Past Pain Medications: </b>${past_pain_medication}<br/>
          <b>Current Pain Medications: </b>${current_pain_medication}<br/>
          <b>Painful Activities: </b>${painfulActivitiesString}<br/>
          <b>Painful Leg Activities: </b>${painfulLegActivitiesString}<br/>
          <b>Helpful Activities: </b>${helpfulActivitiesString}<br/>
          <b>Unoperational Due To Pain: </b>${unoperational_due_to_pain}<br/>
          <b>Physician Visit For Pain: </b>${physician_visit_for_pain}<br/>
          <b>Injection Procedures For Pain: </b>${injection_procedure_for_pain}<br/>
          <b>Injection Types: </b>${injectionTypesString}<br/>
          <b>Injection Relief: </b>${injection_relief}<br/>
          <b>Helpful Injections: </b>${helpful_injection}<br/>
          <b>Injection Relief Duration: </b>${injection_relief_duration}<br/>
          <b>Medical Problems: </b>${medical_problem}<br/>
          <b>Current Medications: </b>${current_medication}<br/><br/></p>
        `
      })
    }
  } catch (err) {
    throw new Error("Unable to establish Nodemailer SMTP mail service")
  }
}

export const sendPasswordResetEmail = ({ userId, name, email, resetURL }: { userId: number, name: string, email: string, resetURL: string }) => {
  try {
    sendEmail({
      mailType: MailTypes.RESET_PASS_REQUESTED,
      to: { 
        email,
        name,
        id: userId
      },
      html: `<p>Dear ${name},<br/><br/>
      You have requested a password reset for <a href="https://peaceofmindspine.com">peaceofmindspine.com</a> account. Please click on the following <a href=${resetURL} target="_self">Link</a> to reset your password. Please note, the link will be valid for 1 hour. </p>`
      })
  } catch (err) {
    throw new Error("Unable to establish Nodemailer SMTP mail service")
  }
}

export const sendPasswordResetCompletedEmail = ({ userId, name, email }: { userId: number, name: string, email: string }) => {
  try {
    sendEmail({
      mailType: MailTypes.RESET_PASS_COMPLETED,
      to: { 
        email,
        name,
        id: userId
      }
    })
  } catch (err) {
    throw new Error("Unable to establish Nodemailer SMTP mail service")
  }
}